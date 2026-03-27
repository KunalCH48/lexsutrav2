import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

export async function GET(
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
      .select("id, pdf_path")
      .eq("id", id)
      .single();

    if (!invoice?.pdf_path) {
      return NextResponse.json({ error: "Invoice PDF not found" }, { status: 404 });
    }

    const { data: signedData, error: signedErr } = await adminClient.storage
      .from("invoices")
      .createSignedUrl(invoice.pdf_path, 60 * 60 * 24); // 24h

    if (signedErr || !signedData) {
      return NextResponse.json({ error: "Could not generate download URL" }, { status: 500 });
    }

    return NextResponse.json({ url: signedData.signedUrl });

  } catch (err) {
    await logError({ error: err, source: "api/admin/invoices/[id]/pdf", action: "GET", metadata: {} });
    return NextResponse.json({ error: "Failed to retrieve invoice PDF" }, { status: 500 });
  }
}
