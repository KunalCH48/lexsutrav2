import { NextRequest, NextResponse } from "next/server";
import { createHash, randomInt, randomUUID } from "crypto";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",        // .xlsx
];
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

function generateOtp() {
  return String(randomInt(100000, 999999));
}

function hashOtp(otp: string) {
  return createHash("sha256").update(otp).digest("hex");
}

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  let companyId: string | null = null;

  try {
    // Auth
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    userId = user.id;

    const adminClient = createSupabaseAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "client" || !profile.company_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    companyId = profile.company_id;

    // Parse file
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF, DOCX, and XLSX files are accepted." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds the 25 MB limit." }, { status: 400 });
    }

    // Upload to Supabase Storage
    const ext       = file.name.split(".").pop() ?? "bin";
    const storePath = `${companyId}/${randomUUID()}.${ext}`;
    const buffer    = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await adminClient.storage
      .from("documents")
      .upload(storePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      await logError({
        error: uploadError,
        source: "api/documents/upload",
        action: "POST:storage",
        userId,
        companyId,
        metadata: { file_name: file.name },
      });
      return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
    }

    // Generate OTP
    const otp          = generateOtp();
    const otpHash      = hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Save document record
    const { data: doc, error: dbError } = await adminClient
      .from("documents")
      .insert({
        company_id:    companyId,
        uploaded_by:   user.id,
        file_name:     file.name,
        file_size:     file.size,
        file_type:     file.type,
        storage_path:  storePath,
        otp_hash:      otpHash,
        otp_expires_at: otpExpiresAt,
        confirmed_at:  null,
      })
      .select("id")
      .single();

    if (dbError || !doc) {
      // Roll back storage upload
      await adminClient.storage.from("documents").remove([storePath]);
      await logError({
        error: dbError ?? new Error("No document row returned"),
        source: "api/documents/upload",
        action: "POST:db",
        userId,
        companyId,
        metadata: { file_name: file.name },
      });
      return NextResponse.json({ error: "Failed to save document record." }, { status: 500 });
    }

    // Get user's email
    const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(user.id);
    const email = authUser?.email ?? user.email ?? "";

    // Send OTP email
    if (process.env.RESEND_API_KEY && email) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "LexSutra <documents@lexsutra.nl>",
          to:   [email],
          subject: "LexSutra — Document Upload Confirmation Code",
          html: `
            <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;background:#080c14;color:#e8f4ff;padding:40px;border-radius:12px;">
              <p style="font-size:20px;font-weight:600;color:#c8a84b;margin-bottom:4px;">LexSutra</p>
              <h2 style="font-size:16px;margin-bottom:20px;color:#e8f4ff;">Document Upload Confirmation</h2>
              <p style="color:rgba(232,244,255,0.7);margin-bottom:24px;">
                You are uploading: <strong style="color:#e8f4ff;">${file.name}</strong><br>
                Enter the code below to confirm and authorise this upload.
              </p>
              <div style="background:rgba(45,156,219,0.1);border:1px solid rgba(45,156,219,0.3);border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="font-size:36px;font-weight:700;letter-spacing:10px;color:#2d9cdb;margin:0;">${otp}</p>
              </div>
              <p style="color:rgba(232,244,255,0.4);font-size:12px;line-height:1.6;">
                This code expires in 30 minutes. Do not share it with anyone.<br>
                By confirming, you consent to LexSutra securely storing this document for EU AI Act compliance purposes.
              </p>
              <p style="color:rgba(232,244,255,0.2);font-size:11px;margin-top:24px;">
                LexSutra · lexsutra.nl · EU data storage only
              </p>
            </div>
          `,
        }),
      });

      if (!emailRes.ok) {
        await logError({
          error: new Error(`Resend returned ${emailRes.status}`),
          source: "api/documents/upload",
          action: "POST:sendOtpEmail",
          severity: "warning",
          userId,
          companyId,
          metadata: { document_id: doc.id, file_name: file.name },
        });
      }
    }

    return NextResponse.json({ documentId: doc.id, email });

  } catch (err) {
    await logError({
      error: err,
      source: "api/documents/upload",
      action: "POST",
      userId,
      companyId,
    });
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
