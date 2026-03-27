import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";
import { InvoicePDF } from "@/lib/invoice-pdf";

export const runtime    = "nodejs";
export const maxDuration = 60;

const TIER_LABELS: Record<string, string> = {
  starter:      "Starter — EU AI Act Public Footprint Pre-Scan",
  core:         "Core — Full Diagnostic + Scorecard",
  premium:      "Premium — Diagnostic + Strategy Session + Investor Readiness Pack",
  full_package: "Full Package — Complete Compliance Engagement",
};

export async function POST(req: NextRequest) {
  const serverClient = await createSupabaseServerClient();
  const adminClient  = createSupabaseAdminClient();

  try {
    // Auth + role check
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

    const body = await req.json() as {
      companyId:     string;
      diagnosticId?: string;
      tier:          string;
      amount:        number;   // caller passes the (possibly overridden) amount
      description?:  string;
      notes?:        string;
    };

    const { companyId, diagnosticId, tier, amount, description, notes } = body;

    if (!companyId || !tier || amount == null) {
      return NextResponse.json({ error: "Missing companyId, tier, or amount" }, { status: 400 });
    }

    if (amount < 0) {
      return NextResponse.json({ error: "Amount cannot be negative" }, { status: 400 });
    }

    // Fetch company
    const { data: company } = await adminClient
      .from("companies")
      .select("id, name, contact_email")
      .eq("id", companyId)
      .single();

    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    // Generate invoice number: LS-{YEAR}-{NNNN}
    const year = new Date().getFullYear();
    const { count } = await adminClient
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .gte("issued_at", `${year}-01-01`)
      .lt("issued_at",  `${year + 1}-01-01`);

    const seq           = ((count ?? 0) + 1).toString().padStart(4, "0");
    const invoiceNumber = `LS-${year}-${seq}`;

    const issuedAt = new Date();
    const dueAt    = new Date(issuedAt.getTime() + 14 * 24 * 60 * 60 * 1000);

    const lineItemDescription = description?.trim() || TIER_LABELS[tier.toLowerCase()] || `EU AI Act Compliance Diagnostic — ${tier}`;
    const lineItems = [{ description: lineItemDescription, qty: 1, unitPrice: amount }];

    // Insert invoice row
    const { data: invoice, error: insertErr } = await adminClient
      .from("invoices")
      .insert({
        company_id:     companyId,
        diagnostic_id:  diagnosticId ?? null,
        invoice_number: invoiceNumber,
        issued_at:      issuedAt.toISOString(),
        due_at:         dueAt.toISOString(),
        amount,
        tier:           tier.toLowerCase(),
        description:    lineItemDescription,
        notes:          notes?.trim() ?? null,
        status:         "draft",
      })
      .select()
      .single();

    if (insertErr || !invoice) {
      await logError({ error: insertErr ?? new Error("Insert failed"), source: "api/admin/invoices/generate", action: "POST:insert", metadata: { companyId, tier } });
      return NextResponse.json({ error: "Failed to create invoice record" }, { status: 500 });
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePDF, {
        invoiceNumber,
        issuedAt:     issuedAt.toISOString(),
        dueAt:        dueAt.toISOString(),
        companyName:  company.name,
        contactEmail: company.contact_email ?? "",
        tier:         tier.toLowerCase(),
        lineItems,
        notes:        notes?.trim() ?? null,
      }) as unknown as React.ReactElement<DocumentProps>
    );

    // Ensure invoices bucket exists
    const { data: buckets } = await adminClient.storage.listBuckets();
    const bucketExists = buckets?.some((b: { name: string }) => b.name === "invoices");
    if (!bucketExists) {
      await adminClient.storage.createBucket("invoices", { public: false });
    }

    // Upload PDF
    const storagePath = `${invoice.id}/invoice.pdf`;
    const { error: uploadErr } = await adminClient.storage
      .from("invoices")
      .upload(storagePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

    if (uploadErr) {
      await logError({ error: uploadErr, source: "api/admin/invoices/generate", action: "POST:upload", metadata: { invoiceId: invoice.id } });
      return NextResponse.json({ error: "PDF generated but upload failed" }, { status: 500 });
    }

    // Update pdf_path
    await adminClient
      .from("invoices")
      .update({ pdf_path: storagePath })
      .eq("id", invoice.id);

    // Generate 24h signed URL
    const { data: signedData } = await adminClient.storage
      .from("invoices")
      .createSignedUrl(storagePath, 60 * 60 * 24);

    // Log to activity_log (non-critical — don't let it fail the request)
    try {
      await adminClient.from("activity_log").insert({
        actor_id:    user.id,
        action:      "generate_invoice",
        entity_type: "invoices",
        entity_id:   companyId,
        metadata:    { invoice_id: invoice.id, invoice_number: invoiceNumber, tier, amount },
      });
    } catch { /* non-critical */ }

    return NextResponse.json({
      success:       true,
      invoiceId:     invoice.id,
      invoiceNumber,
      signedUrl:     signedData?.signedUrl ?? null,
    });

  } catch (err) {
    await logError({ error: err, source: "api/admin/invoices/generate", action: "POST", metadata: {} });
    return NextResponse.json({ error: "Invoice generation failed. Please try again." }, { status: 500 });
  }
}
