import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

export async function GET() {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("prospects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = createSupabaseAdminClient();

  const { data, error } = await db
    .from("prospects")
    .insert({
      name: body.name || null,
      company: body.company,
      url: body.url || null,
      linkedin_url: body.linkedin_url || null,
      contact_email: body.contact_email || null,
      status: body.status || "new",
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
