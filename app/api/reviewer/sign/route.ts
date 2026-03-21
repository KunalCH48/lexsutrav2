import { NextRequest, NextResponse } from "next/server";
import { createHash, randomInt } from "crypto";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

function hashOtp(otp: string) {
  return createHash("sha256").update(otp).digest("hex");
}

// POST /api/reviewer/sign
// Body: { diagnosticId: string }
// Generates OTP, stores hash in report_approvals, sends email to reviewer
export async function POST(req: NextRequest) {
  let userId: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    userId = user.id;

    const adminClient = createSupabaseAdminClient();

    // Must be a reviewer or admin
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role, display_name, credential")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "reviewer"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { diagnosticId } = await req.json() as { diagnosticId: string };
    if (!diagnosticId) {
      return NextResponse.json({ error: "Missing diagnosticId" }, { status: 400 });
    }

    // Verify the diagnostic exists
    const { data: diagnostic } = await adminClient
      .from("diagnostics")
      .select("id, status")
      .eq("id", diagnosticId)
      .single();

    if (!diagnostic) {
      return NextResponse.json({ error: "Diagnostic not found" }, { status: 404 });
    }

    // For reviewers: verify they have access to this diagnostic's company
    if (profile.role === "reviewer") {
      const { data: accessCheck } = await adminClient
        .from("reviewer_company_access")
        .select("id")
        .eq("reviewer_id", user.id)
        .eq(
          "company_id",
          adminClient
            .from("ai_systems")
            .select("company_id")
            .eq("id",
              adminClient.from("diagnostics").select("ai_system_id").eq("id", diagnosticId).single()
            )
        )
        .maybeSingle();

      // Simpler check: get the diagnostic's company_id via join and check access table
      const { data: diagWithCompany } = await adminClient
        .from("diagnostics")
        .select("ai_systems ( company_id )")
        .eq("id", diagnosticId)
        .single();

      const sys = diagWithCompany?.ai_systems as { company_id: string } | { company_id: string }[] | null;
      const companyId = Array.isArray(sys) ? sys[0]?.company_id : sys?.company_id;

      if (companyId) {
        const { data: access } = await adminClient
          .from("reviewer_company_access")
          .select("id")
          .eq("reviewer_id", user.id)
          .eq("company_id", companyId)
          .maybeSingle();

        if (!access) {
          return NextResponse.json({ error: "You do not have access to this diagnostic" }, { status: 403 });
        }
      }
    }

    // Generate OTP
    const otp     = String(randomInt(100000, 999999));
    const hash    = hashOtp(otp);
    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const reviewerName = profile.display_name ?? user.email ?? "Reviewer";
    const credential   = profile.credential ?? null;

    // Upsert into report_approvals (one record per reviewer per diagnostic)
    const { error: upsertError } = await adminClient
      .from("report_approvals")
      .upsert(
        {
          diagnostic_id:  diagnosticId,
          reviewer_id:    user.id,
          reviewer_name:  reviewerName,
          credential,
          otp_hash:       hash,
          otp_expires_at: expires,
          approved_at:    null,
          ip_address:     null,
        },
        { onConflict: "diagnostic_id,reviewer_id" }
      );

    if (upsertError) {
      await logError({ error: upsertError, source: "api/reviewer/sign", action: "POST:upsert", userId });
      return NextResponse.json({ error: "Failed to initiate signing" }, { status: 500 });
    }

    // Send OTP email
    const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(user.id);
    const email = authUser?.email ?? user.email ?? "";

    if (process.env.RESEND_API_KEY && email) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:    "LexSutra <hello@send.lexsutra.com>",
          to:      [email],
          subject: "LexSutra — Report Sign-off Code",
          html: `
            <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;background:#080c14;color:#e8f4ff;padding:40px;border-radius:12px;">
              <p style="font-size:20px;font-weight:600;color:#c8a84b;margin-bottom:4px;">LexSutra</p>
              <h2 style="font-size:16px;margin-bottom:20px;color:#e8f4ff;">Report Sign-off Code</h2>
              <p style="color:rgba(232,244,255,0.7);margin-bottom:8px;">Hello ${reviewerName},</p>
              <p style="color:rgba(232,244,255,0.7);margin-bottom:24px;">
                Enter this code to sign and approve the diagnostic report. Your name and credential will be
                permanently recorded on the report as reviewer.
              </p>
              <div style="background:rgba(45,156,219,0.1);border:1px solid rgba(45,156,219,0.3);border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="font-size:36px;font-weight:700;letter-spacing:10px;color:#2d9cdb;margin:0;">${otp}</p>
              </div>
              <p style="color:rgba(232,244,255,0.4);font-size:12px;">
                This code expires in 30 minutes. By entering it you confirm you have reviewed
                and approved the report. This action creates a non-repudiable audit record.
              </p>
            </div>
          `,
        }),
      });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    await logError({ error: err, source: "api/reviewer/sign", action: "POST", userId });
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
