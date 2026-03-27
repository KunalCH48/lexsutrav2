import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

function fmtEur(n: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency", currency: "EUR", minimumFractionDigits: 2,
  }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function buildInvoiceEmailHtml({
  companyName,
  contactEmail,
  invoiceNumber,
  amount,
  issuedAt,
  dueAt,
  description,
  pdfUrl,
}: {
  companyName:   string;
  contactEmail:  string;
  invoiceNumber: string;
  amount:        number;
  issuedAt:      string;
  dueAt:         string;
  description:   string | null;
  pdfUrl:        string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Invoice ${invoiceNumber} — LexSutra</title>
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
                <span style="font-size:11px;color:#8899aa;letter-spacing:0.4px;">INVOICE  |  ${invoiceNumber}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Gold rule -->
      <tr><td style="height:3px;background:#c8a84b;"></td></tr>

      <!-- Body -->
      <tr>
        <td style="padding:36px 36px 28px 36px;">

          <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#9ca3af;margin:0 0 6px 0;">
            EU AI Act Compliance Diagnostic
          </p>
          <h1 style="font-size:24px;font-weight:700;color:#1a2030;margin:0 0 4px 0;font-family:Georgia,serif;">
            Invoice from LexSutra
          </h1>
          <p style="font-size:12px;color:#6b7280;margin:0 0 28px 0;">${companyName}</p>

          <!-- Amount box -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;width:100%;">
            <tr>
              <td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:13px;color:#6b7280;">Amount Due</td>
                    <td align="right" style="font-size:26px;font-weight:800;color:#1a2030;font-family:Georgia,serif;">${fmtEur(amount)}</td>
                  </tr>
                  <tr>
                    <td style="font-size:11px;color:#9ca3af;padding-top:4px;">Due ${fmtDate(dueAt)}</td>
                    <td align="right" style="font-size:11px;color:#9ca3af;padding-top:4px;">14 days net</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Info table -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;margin-bottom:28px;">
            <tr>
              <td style="background:#f9fafb;padding:16px 20px;border-radius:5px;">
                <p style="font-size:12px;font-weight:700;color:#4a5568;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 10px 0;">Invoice Details</p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  ${[
                    ["Invoice Number", invoiceNumber],
                    ["Issue Date",     fmtDate(issuedAt)],
                    ["Due Date",       fmtDate(dueAt)],
                    ["Description",   description ?? "EU AI Act Compliance Diagnostic"],
                    ["VAT",           "€0.00 (VAT number pending registration)"],
                  ].map(([l, v]) => `
                  <tr>
                    <td style="font-size:11.5px;color:#9ca3af;padding:3px 0;width:160px;">${l}</td>
                    <td style="font-size:11.5px;color:#1a2030;padding:3px 0;font-weight:600;">${v}</td>
                  </tr>`).join("")}
                </table>
              </td>
            </tr>
          </table>

          <!-- Payment instructions -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid #2d9cdb;background:#f0f8ff;border-radius:0 4px 4px 0;margin-bottom:28px;">
            <tr>
              <td style="padding:14px 16px;">
                <p style="font-size:12px;font-weight:700;color:#1d6fa4;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px 0;">Payment Instructions</p>
                <p style="font-size:12px;color:#374151;margin:0 0 4px 0;">Please transfer the amount due by bank transfer.</p>
                <p style="font-size:12px;color:#374151;margin:0 0 4px 0;"><strong>Reference:</strong> ${invoiceNumber}</p>
                <p style="font-size:11px;color:#6b7280;margin:0;">Bank details are included in the attached PDF invoice.</p>
              </td>
            </tr>
          </table>

          <!-- Download button -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="background:#1d6fa4;border-radius:6px;padding:13px 28px;">
                <a href="${pdfUrl}" style="color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.2px;">
                  Download Invoice PDF →
                </a>
              </td>
            </tr>
          </table>

          <p style="font-size:13px;color:#374151;line-height:1.7;margin:0 0 8px 0;">
            If you have any questions about this invoice, please reply to this email or contact us at
            <a href="mailto:hello@lexsutra.com" style="color:#1d6fa4;text-decoration:none;">hello@lexsutra.com</a>.
          </p>

          <p style="font-size:13px;color:#374151;margin:0;">
            Kind regards,<br/>
            <strong>LexSutra</strong><br/>
            <span style="color:#9ca3af;">AI Compliance Diagnostic Infrastructure · lexsutra.com</span>
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f0f2f4;border-top:1px solid #e2e6ea;padding:16px 32px;text-align:center;">
          <p style="font-size:10px;color:#9ca3af;margin:0 0 4px 0;">
            LexSutra · KVK: 42020470 · Netherlands · lexsutra.com
          </p>
          <p style="font-size:9.5px;color:#c4c9d0;margin:0;line-height:1.6;">
            This invoice was sent to ${contactEmail}.
            LexSutra is not a law firm. This does not constitute legal advice.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const serverClient = await createSupabaseServerClient();
  const adminClient  = createSupabaseAdminClient();

  try {
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const { id } = await params;
    const body = await req.json() as { toEmail: string };
    const { toEmail } = body;

    if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Fetch invoice + company
    const { data: invoice } = await adminClient
      .from("invoices")
      .select("id, invoice_number, amount, issued_at, due_at, description, pdf_path, status, company_id")
      .eq("id", id)
      .single();

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (!invoice.pdf_path) return NextResponse.json({ error: "Invoice PDF not yet generated" }, { status: 400 });

    const { data: company } = await adminClient
      .from("companies")
      .select("name, contact_email")
      .eq("id", invoice.company_id)
      .single();

    // Generate fresh 24h signed URL
    const { data: signedData } = await adminClient.storage
      .from("invoices")
      .createSignedUrl(invoice.pdf_path, 60 * 60 * 24);

    if (!signedData?.signedUrl) {
      return NextResponse.json({ error: "Could not generate PDF download URL" }, { status: 500 });
    }

    const html = buildInvoiceEmailHtml({
      companyName:   company?.name ?? toEmail,
      contactEmail:  toEmail,
      invoiceNumber: invoice.invoice_number,
      amount:        invoice.amount,
      issuedAt:      invoice.issued_at,
      dueAt:         invoice.due_at,
      description:   invoice.description,
      pdfUrl:        signedData.signedUrl,
    });

    // Send via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization:  `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    "LexSutra <hello@send.lexsutra.com>",
        to:      [toEmail],
        subject: `Invoice ${invoice.invoice_number} — LexSutra`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      await logError({ error: new Error(`Resend ${emailRes.status}: ${errBody}`), source: "api/admin/invoices/[id]/send-email", action: "POST:resend", metadata: { invoiceId: id, toEmail } });
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    // Update status to sent
    await adminClient
      .from("invoices")
      .update({ status: "sent" })
      .eq("id", id)
      .eq("status", "draft"); // only update if still draft

    // Log (non-critical)
    try {
      await adminClient.from("activity_log").insert({
        actor_id:    user.id,
        action:      "send_invoice",
        entity_type: "invoices",
        entity_id:   invoice.company_id,
        metadata:    { invoice_id: id, invoice_number: invoice.invoice_number, to_email: toEmail },
      });
    } catch { /* non-critical */ }

    return NextResponse.json({ success: true, sentTo: toEmail });

  } catch (err) {
    await logError({ error: err, source: "api/admin/invoices/[id]/send-email", action: "POST", metadata: {} });
    return NextResponse.json({ error: "Email sending failed. Please try again." }, { status: 500 });
  }
}
