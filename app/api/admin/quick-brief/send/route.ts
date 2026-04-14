import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

export const runtime = "nodejs";

// ── POST — download PDF + send via Resend + cleanup ────────────────

export async function POST(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();

  try {
    const body = await req.json() as {
      contactEmail: string;
      contactName:  string;
      companyName:  string;
      emailSubject: string;
      emailBody:       string;
      storagePath:     string;
      fileName:        string;
      deleteAfterSend?: boolean; // default true (quick-brief temp files); pass false to keep (snapshot PDFs)
    };

    const { contactEmail, contactName, companyName, emailSubject, emailBody, storagePath, fileName, deleteAfterSend = true } = body;

    if (!contactEmail || !emailSubject || !emailBody || !storagePath || !fileName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service not configured (RESEND_API_KEY missing)" },
        { status: 500 }
      );
    }

    // ── Download PDF from storage ──────────────────────────────────
    const { data: pdfBlob, error: downloadError } = await adminClient.storage
      .from("demo-reports")
      .download(storagePath);

    if (downloadError || !pdfBlob) {
      return NextResponse.json(
        { error: "Could not retrieve PDF. Please regenerate the brief." },
        { status: 404 }
      );
    }

    const pdfBase64 = Buffer.from(await pdfBlob.arrayBuffer()).toString("base64");

    // ── Build HTML email ───────────────────────────────────────────
    const greeting   = contactName?.trim() ? `Hi ${contactName.trim().split(" ")[0]},` : "Hi,";
    const bodyLines  = emailBody.replace(new RegExp(`^Hi,\\n|^Hi [^,]+,\\n`, ""), "").trim();
    const htmlBody   = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:32px 16px;background:#f4f5f6;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;">
  <tr>
    <td style="background:#0d1520;border-radius:8px 8px 0 0;padding:16px 28px;">
      <span style="font-size:18px;font-weight:700;color:#fff;">
        <span style="color:#2d9cdb;">Lex</span>Sutra
      </span>
    </td>
  </tr>
  <tr><td style="height:3px;background:#1d6fa4;"></td></tr>
  <tr>
    <td style="background:#ffffff;padding:32px 28px;border-radius:0 0 8px 8px;">
      <p style="font-size:14px;color:#374151;line-height:1.8;margin:0 0 12px 0;">${greeting}</p>
      <p style="font-size:14px;color:#374151;line-height:1.8;margin:0 0 16px 0;white-space:pre-line;">${bodyLines
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</p>
      <p style="font-size:11px;color:#9ca3af;margin:28px 0 0 0;border-top:1px solid #e5e7eb;padding-top:16px;line-height:1.6;">
        LexSutra · AI Compliance Diagnostic Infrastructure · lexsutra.com · Netherlands<br/>
        This report does not constitute legal advice. LexSutra is not a law firm.
        This email was sent to ${contactEmail}.
      </p>
    </td>
  </tr>
</table>
</body>
</html>`;

    // ── Send via Resend REST API ───────────────────────────────────
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization:  `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:        "Kunal Chaudhari <kunal@lexsutra.com>",
        to:          [contactEmail],
        subject:     emailSubject,
        html:        htmlBody,
        text:        emailBody,
        attachments: [{
          filename: fileName,
          content:  pdfBase64,
        }],
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      await logError({
        error: new Error(`Resend ${emailRes.status}: ${errBody}`),
        source: "api/admin/quick-brief/send",
        action: "POST:resend",
        metadata: { contactEmail, companyName },
      });
      return NextResponse.json({ error: "Email send failed. Please try again." }, { status: 500 });
    }

    // ── Log to activity_log ────────────────────────────────────────
    await adminClient.from("activity_log").insert({
      actor_id:    null,
      action:      "quick_brief_sent",
      entity_type: "quick_brief",
      entity_id:   null,
      metadata:    {
        to_email:     contactEmail,
        company_name: companyName,
        file_name:    fileName,
      },
    }).catch(() => null); // non-critical

    // ── Delete temp PDF from storage (only for quick-brief temp files) ──
    if (deleteAfterSend) {
      await adminClient.storage
        .from("demo-reports")
        .remove([storagePath])
        .catch(() => null); // best-effort
    }

    return NextResponse.json({ ok: true, sentTo: contactEmail });

  } catch (err) {
    await logError({
      error: err,
      source: "api/admin/quick-brief/send",
      action: "POST",
      metadata: {},
    });
    return NextResponse.json({ error: "Send failed. Please try again." }, { status: 500 });
  }
}
