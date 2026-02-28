import { NextRequest, NextResponse } from "next/server";
import { createHash, randomInt } from "crypto";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

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
      .select("company_id")
      .eq("id", user.id)
      .single();
    companyId = profile?.company_id ?? null;

    const body = await req.json() as {
      documentId: string;
      otp?: string;
      action?: "verify" | "resend";
    };
    const { documentId, otp, action = "verify" } = body;

    if (!documentId) {
      return NextResponse.json({ error: "Missing document ID." }, { status: 400 });
    }

    // Fetch the document
    const { data: doc } = await adminClient
      .from("documents")
      .select("id, company_id, file_name, otp_hash, otp_expires_at, confirmed_at")
      .eq("id", documentId)
      .single();

    if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    if (doc.company_id !== companyId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    // ── RESEND OTP ──────────────────────────────────────────────
    if (action === "resend") {
      const newOtp    = String(randomInt(100000, 999999));
      const newHash   = hashOtp(newOtp);
      const newExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      await adminClient
        .from("documents")
        .update({ otp_hash: newHash, otp_expires_at: newExpiry })
        .eq("id", documentId);

      const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(user.id);
      const email = authUser?.email ?? user.email ?? "";

      if (process.env.RESEND_API_KEY && email) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "LexSutra <documents@lexsutra.nl>",
            to:   [email],
            subject: "LexSutra — New Document Confirmation Code",
            html: `
              <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;background:#080c14;color:#e8f4ff;padding:40px;border-radius:12px;">
                <p style="font-size:20px;font-weight:600;color:#c8a84b;margin-bottom:4px;">LexSutra</p>
                <h2 style="font-size:16px;margin-bottom:20px;color:#e8f4ff;">New Confirmation Code</h2>
                <p style="color:rgba(232,244,255,0.7);margin-bottom:24px;">
                  Document: <strong style="color:#e8f4ff;">${doc.file_name}</strong>
                </p>
                <div style="background:rgba(45,156,219,0.1);border:1px solid rgba(45,156,219,0.3);border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
                  <p style="font-size:36px;font-weight:700;letter-spacing:10px;color:#2d9cdb;margin:0;">${newOtp}</p>
                </div>
                <p style="color:rgba(232,244,255,0.4);font-size:12px;">Expires in 30 minutes.</p>
              </div>
            `,
          }),
        });
      }

      return NextResponse.json({ success: true, message: "New code sent to your email." });
    }

    // ── VERIFY OTP ──────────────────────────────────────────────
    if (!otp) return NextResponse.json({ error: "Missing OTP code." }, { status: 400 });

    if (doc.confirmed_at) {
      return NextResponse.json({ error: "This document is already confirmed." }, { status: 400 });
    }

    if (!doc.otp_expires_at || new Date(doc.otp_expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (hashOtp(otp.trim()) !== doc.otp_hash) {
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    const { error: updateError } = await adminClient
      .from("documents")
      .update({ confirmed_at: new Date().toISOString() })
      .eq("id", documentId);

    if (updateError) {
      await logError({
        error: updateError,
        source: "api/documents/otp",
        action: "POST:confirm",
        userId,
        companyId,
        metadata: { documentId },
      });
      return NextResponse.json({ error: "Failed to confirm document." }, { status: 500 });
    }

    // Audit log
    await adminClient.from("activity_log").insert({
      actor_id:    user.id,
      action:      "confirm_document_upload",
      entity_type: "documents",
      entity_id:   documentId,
      metadata:    { file_name: doc.file_name },
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    await logError({
      error: err,
      source: "api/documents/otp",
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
