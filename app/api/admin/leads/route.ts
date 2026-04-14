import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

// ── POST — create a manual prospect (demo_requests with source='manual') ──

export async function POST(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();

  try {
    const body = await req.json() as {
      companyName:  string;
      websiteUrl?:  string;
      contactName?: string;
      contactEmail: string;
    };

    const { companyName, websiteUrl, contactName, contactEmail } = body;

    if (!companyName?.trim() || !contactEmail?.trim()) {
      return NextResponse.json({ error: "companyName and contactEmail are required" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const { data, error } = await adminClient
      .from("demo_requests")
      .insert({
        company_name:  companyName.trim(),
        website_url:   websiteUrl?.trim() || null,
        contact_name:  contactName?.trim() || null,
        contact_email: contactEmail.trim().toLowerCase(),
        status:        "pending",
        source:        "manual",
      })
      .select("id")
      .single();

    if (error) {
      await logError({ error, source: "api/admin/leads", action: "POST:insert", metadata: { companyName } });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });

  } catch (err) {
    await logError({ error: err, source: "api/admin/leads", action: "POST", metadata: {} });
    return NextResponse.json({ error: "Failed to create prospect" }, { status: 500 });
  }
}
