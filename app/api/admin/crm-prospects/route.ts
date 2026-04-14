import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

// GET /api/admin/crm-prospects
// Returns CRM prospects, excluding any already imported into demo_requests

export async function GET() {
  const db = createSupabaseAdminClient();

  const [{ data: prospects }, { data: existing }] = await Promise.all([
    db
      .from("prospects")
      .select("id, company, name, url, contact_email, icp_score, status")
      .order("created_at", { ascending: false }),

    db
      .from("demo_requests")
      .select("contact_email")
      .eq("source", "manual"),
  ]);

  const importedEmails = new Set(
    (existing ?? []).map((r: { contact_email: string }) => r.contact_email?.toLowerCase())
  );

  const filtered = (prospects ?? []).filter(
    (p: { contact_email: string | null }) =>
      !p.contact_email || !importedEmails.has(p.contact_email.toLowerCase())
  );

  return NextResponse.json(filtered);
}
