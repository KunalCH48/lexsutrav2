import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

type InsightsSnapshot = {
  versions: { v: number; content: string; generated_at: string }[];
  approved_pdf_path?: string;
};

type StructuredReport = {
  grade: string;
  risk_classification: string;
  risk_tier: string;
  obligations: { status: string }[];
};

function buildEmailHtml({
  companyName,
  contactEmail,
  grade,
  riskClassification,
  criticalCount,
  partialCount,
  compliantCount,
  downloadUrl,
  reportRef,
  assessmentDate,
}: {
  companyName:        string;
  contactEmail:       string;
  grade:              string;
  riskClassification: string;
  criticalCount:      number;
  partialCount:       number;
  compliantCount:     number;
  downloadUrl:        string;
  reportRef:          string;
  assessmentDate:     string;
}): string {
  const gradeColor = criticalCount >= 2 ? "#c0392b" : criticalCount >= 1 ? "#b7770a" : "#15803d";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>LexSutra EU AI Act Compliance Snapshot — ${companyName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f6;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f6;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

      <!-- Header bar -->
      <tr>
        <td style="background:#0d1520;padding:18px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                  <span style="color:#2d9cdb;">Lex</span>Sutra
                </span>
              </td>
              <td align="right">
                <span style="font-size:11px;color:#8899aa;letter-spacing:0.4px;">CONFIDENTIAL  |  ${reportRef}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Blue rule -->
      <tr><td style="height:3px;background:#1d6fa4;"></td></tr>

      <!-- Body -->
      <tr>
        <td style="padding:36px 36px 28px 36px;">

          <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#9ca3af;margin:0 0 6px 0;">
            EU AI Act Compliance Diagnostic Report
          </p>
          <h1 style="font-size:26px;font-weight:700;color:#1a2030;margin:0 0 4px 0;font-family:Georgia,serif;">
            ${companyName}
          </h1>
          <p style="font-size:12px;color:#6b7280;margin:0 0 28px 0;">${riskClassification}</p>

          <!-- Grade + stats -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="width:68px;height:68px;border-radius:8px;border:2px solid #8b6914;background:#fdf8ee;text-align:center;vertical-align:middle;">
                <span style="font-size:28px;font-weight:800;color:${gradeColor};font-family:Georgia,serif;line-height:1;">${grade}</span>
              </td>
              <td style="padding-left:18px;vertical-align:middle;">
                <p style="font-size:11px;color:#9ca3af;margin:0 0 4px 0;">Overall Compliance Grade</p>
                <p style="font-size:13px;color:#1a2030;font-weight:700;margin:0 0 5px 0;">
                  Your pre-diagnostic compliance snapshot is ready
                </p>
                <p style="font-size:11px;color:#6b7280;margin:0;">
                  ${criticalCount > 0 ? `<span style="color:#c0392b;font-weight:600;">${criticalCount} critical gap${criticalCount !== 1 ? "s" : ""}</span>  ·  ` : ""}${partialCount > 0 ? `<span style="color:#b7770a;">${partialCount} partial</span>  ·  ` : ""}${compliantCount > 0 ? `<span style="color:#15803d;">${compliantCount} compliant</span>` : ""}
                </p>
              </td>
            </tr>
          </table>

          <!-- Intro text -->
          <p style="font-size:13.5px;color:#374151;line-height:1.7;margin:0 0 16px 0;">
            Dear ${companyName} team,
          </p>
          <p style="font-size:13.5px;color:#374151;line-height:1.7;margin:0 0 16px 0;">
            LexSutra has completed a pre-diagnostic compliance snapshot of your organisation against all
            eight mandatory obligations of the EU AI Act (Regulation (EU) 2024/1689). This assessment
            is based on publicly available information and provides an indicative view of your current
            compliance posture ahead of a full diagnostic engagement.
          </p>
          <p style="font-size:13.5px;color:#374151;line-height:1.7;margin:0 0 28px 0;">
            Your full report — including detailed obligation findings, required actions, effort estimates,
            and a prioritised remediation roadmap — is attached and available to download below.
          </p>

          <!-- Download button -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="background:#1d6fa4;border-radius:6px;padding:13px 28px;">
                <a href="${downloadUrl}" style="color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.2px;">
                  Download Your Compliance Report →
                </a>
              </td>
            </tr>
          </table>
          <p style="font-size:11px;color:#9ca3af;margin:-20px 0 28px 0;">
            This download link is valid for 7 days. Contact us if you need a new link.
          </p>

          <!-- Info box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;margin-bottom:28px;">
            <tr>
              <td style="background:#f9fafb;padding:16px 20px;border-radius:5px;">
                <p style="font-size:12px;font-weight:700;color:#4a5568;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 10px 0;">
                  Assessment Details
                </p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  ${[
                    ["Report Reference", reportRef],
                    ["Assessment Date",  assessmentDate],
                    ["Regulation",       "EU AI Act — Regulation (EU) 2024/1689"],
                    ["Assessed Against", "EU AI Act v1.0 — Active from August 2024"],
                  ].map(([l, v]) => `
                  <tr>
                    <td style="font-size:11.5px;color:#9ca3af;padding:3px 0;width:160px;">${l}</td>
                    <td style="font-size:11.5px;color:#1a2030;padding:3px 0;font-weight:600;">${v}</td>
                  </tr>`).join("")}
                </table>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <p style="font-size:13.5px;color:#374151;line-height:1.7;margin:0 0 8px 0;">
            The next step is a full diagnostic engagement where we will assess your actual internal
            documentation, systems, and processes. This snapshot is the starting point — the full
            diagnostic gives you everything you need to achieve compliance before the August 2026 deadline.
          </p>
          <p style="font-size:13.5px;color:#374151;line-height:1.7;margin:0 0 28px 0;">
            If you have any questions about this report or would like to begin the full diagnostic,
            please reply to this email or contact us at
            <a href="mailto:hello@lexsutra.nl" style="color:#1d6fa4;text-decoration:none;">hello@lexsutra.nl</a>.
          </p>

          <p style="font-size:13.5px;color:#374151;margin:0;">
            Kind regards,<br/>
            <strong>LexSutra Expert Review Team</strong><br/>
            <span style="color:#9ca3af;">LexSutra B.V. · AI Compliance Diagnostic Infrastructure · lexsutra.nl</span>
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f0f2f4;border-top:1px solid #e2e6ea;padding:16px 32px;text-align:center;">
          <p style="font-size:10px;color:#9ca3af;margin:0 0 4px 0;">
            LexSutra B.V. · AI Compliance Diagnostic Infrastructure · lexsutra.nl · Netherlands
          </p>
          <p style="font-size:9.5px;color:#c4c9d0;margin:0;line-height:1.6;">
            This report does not constitute legal advice. LexSutra is not a law firm.
            The client is responsible for their own regulatory compliance.
            This email was sent to ${contactEmail}.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── POST — send snapshot email ─────────────────────────────────────

export async function POST(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();

  try {
    const body = await req.json() as { demoId: string; toEmail: string };
    const { demoId, toEmail } = body;

    if (!demoId || !toEmail) {
      return NextResponse.json({ error: "Missing demoId or toEmail" }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured (RESEND_API_KEY missing)" }, { status: 500 });
    }

    // Load demo
    const { data: demo } = await adminClient
      .from("demo_requests")
      .select("id, company_name, contact_email, insights_snapshot")
      .eq("id", demoId)
      .single();

    if (!demo) {
      return NextResponse.json({ error: "Demo request not found" }, { status: 404 });
    }

    const snapshot     = (demo.insights_snapshot ?? {}) as InsightsSnapshot;
    const pdfPath      = snapshot.approved_pdf_path;
    const latestVersion = snapshot.versions?.[snapshot.versions.length - 1];

    if (!pdfPath) {
      return NextResponse.json({ error: "No approved PDF found. Generate and approve the snapshot first." }, { status: 400 });
    }

    // Generate a 7-day signed URL for the email
    const { data: signedData, error: signedErr } = await adminClient.storage
      .from("demo-reports")
      .createSignedUrl(pdfPath, 60 * 60 * 24 * 7); // 7 days

    if (signedErr || !signedData) {
      await logError({ error: signedErr ?? new Error("No signed URL"), source: "api/admin/demo-email", action: "POST:signedUrl", metadata: { demoId } });
      return NextResponse.json({ error: "Failed to generate download link for PDF." }, { status: 500 });
    }

    // Parse report for email content
    let grade              = "—";
    let riskClassification = "AI System Compliance Assessment";
    let criticalCount      = 0;
    let partialCount       = 0;
    let compliantCount     = 0;

    if (latestVersion) {
      try {
        const parsed = JSON.parse(latestVersion.content) as StructuredReport;
        grade              = parsed.grade ?? "—";
        riskClassification = parsed.risk_classification ?? riskClassification;
        criticalCount      = parsed.obligations.filter(o => o.status === "critical_gap").length;
        partialCount       = parsed.obligations.filter(o => o.status === "partial").length;
        compliantCount     = parsed.obligations.filter(o => o.status === "compliant").length;
      } catch { /* use defaults */ }
    }

    const reportRef     = `LSR-${new Date().getFullYear()}-${demoId.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
    const assessmentDate = latestVersion
      ? new Date(latestVersion.generated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
      : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

    const html = buildEmailHtml({
      companyName:        demo.company_name,
      contactEmail:       toEmail,
      grade,
      riskClassification,
      criticalCount,
      partialCount,
      compliantCount,
      downloadUrl:        signedData.signedUrl,
      reportRef,
      assessmentDate,
    });

    // Send via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    "LexSutra <reports@lexsutra.nl>",
        to:      [toEmail],
        subject: `LexSutra Compliance Snapshot — ${demo.company_name} [${reportRef}]`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      await logError({ error: new Error(`Resend ${emailRes.status}: ${errBody}`), source: "api/admin/demo-email", action: "POST:resend", metadata: { demoId, toEmail } });
      return NextResponse.json({ error: "Failed to send email. Please try again." }, { status: 500 });
    }

    // Log the send
    await adminClient.from("activity_log").insert({
      actor_id:    null,
      action:      "send_snapshot_email",
      entity_type: "demo_requests",
      entity_id:   demoId,
      metadata:    { to_email: toEmail, report_ref: reportRef },
    }).catch(() => null); // non-critical

    return NextResponse.json({ success: true, sentTo: toEmail });

  } catch (err) {
    await logError({ error: err, source: "api/admin/demo-email", action: "POST", metadata: {} });
    return NextResponse.json({ error: "Email sending failed. Please try again." }, { status: 500 });
  }
}
