import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

function hashOtp(otp: string) {
  return createHash("sha256").update(otp).digest("hex");
}

// POST /api/reviewer/sign/confirm
// Body: { diagnosticId: string; otp: string }
// Verifies OTP and sets approved_at + ip_address on report_approvals
export async function POST(req: NextRequest) {
  let userId: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    userId = user.id;

    const adminClient = createSupabaseAdminClient();

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "reviewer"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { diagnosticId, otp } = await req.json() as { diagnosticId: string; otp: string };
    if (!diagnosticId || !otp) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch the pending approval record
    const { data: approval } = await adminClient
      .from("report_approvals")
      .select("id, otp_hash, otp_expires_at, approved_at")
      .eq("diagnostic_id", diagnosticId)
      .eq("reviewer_id", user.id)
      .maybeSingle();

    if (!approval) {
      return NextResponse.json(
        { error: "No pending sign-off found. Please request a new code." },
        { status: 404 }
      );
    }

    if (approval.approved_at) {
      return NextResponse.json({ error: "This report has already been signed." }, { status: 400 });
    }

    if (!approval.otp_expires_at || new Date(approval.otp_expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (hashOtp(otp.trim()) !== approval.otp_hash) {
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
    }

    // Get IP for audit trail
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown";

    const now = new Date().toISOString();

    const { error: updateError } = await adminClient
      .from("report_approvals")
      .update({
        approved_at: now,
        ip_address:  ip,
        otp_hash:    null,      // clear the hash after use
        otp_expires_at: null,
      })
      .eq("id", approval.id);

    if (updateError) {
      await logError({ error: updateError, source: "api/reviewer/sign/confirm", action: "POST:update", userId });
      return NextResponse.json({ error: "Failed to record approval" }, { status: 500 });
    }

    // Audit log
    await adminClient.from("activity_log").insert({
      actor_id:    user.id,
      action:      "reviewer_signed_report",
      entity_type: "diagnostics",
      entity_id:   diagnosticId,
      metadata:    { ip_address: ip },
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    await logError({ error: err, source: "api/reviewer/sign/confirm", action: "POST", userId });
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
