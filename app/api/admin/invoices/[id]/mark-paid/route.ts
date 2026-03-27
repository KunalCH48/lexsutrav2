import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

export async function PATCH(
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

    const { id } = await params;

    const { data: invoice } = await adminClient
      .from("invoices")
      .select("id, company_id, invoice_number, status")
      .eq("id", id)
      .single();

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (invoice.status === "paid") return NextResponse.json({ error: "Invoice already marked as paid" }, { status: 400 });

    // Mark invoice as paid
    const paidAt = new Date().toISOString();
    await adminClient
      .from("invoices")
      .update({ status: "paid", paid_at: paidAt })
      .eq("id", id);

    // Flip payment_received on client_onboarding if the row exists (non-critical)
    try {
      await adminClient
        .from("client_onboarding")
        .update({ payment_received: true })
        .eq("company_id", invoice.company_id);
    } catch { /* non-critical */ }

    // Log (non-critical)
    try {
      await adminClient.from("activity_log").insert({
        actor_id:    user.id,
        action:      "mark_invoice_paid",
        entity_type: "invoices",
        entity_id:   invoice.company_id,
        metadata:    { invoice_id: id, invoice_number: invoice.invoice_number, paid_at: paidAt },
      });
    } catch { /* non-critical */ }

    return NextResponse.json({ success: true, paidAt });

  } catch (err) {
    await logError({ error: err, source: "api/admin/invoices/[id]/mark-paid", action: "PATCH", metadata: {} });
    return NextResponse.json({ error: "Failed to mark invoice as paid" }, { status: 500 });
  }
}
