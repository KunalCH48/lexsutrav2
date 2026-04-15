import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

export async function GET() {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("job_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = createSupabaseAdminClient();

  const { data, error } = await db
    .from("job_applications")
    .insert({
      company: body.company,
      role: body.role,
      url: body.url || null,
      contact_name: body.contact_name || null,
      contact_title: body.contact_title || null,
      contact_linkedin: body.contact_linkedin || null,
      status: body.status || "applied",
      notes: body.notes || null,
      applied_at: body.applied_at || new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
