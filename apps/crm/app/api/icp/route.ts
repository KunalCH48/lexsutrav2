import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

export async function GET() {
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("icp_config").select("*").eq("id", 1).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const { description } = await req.json();
  const db = createSupabaseAdminClient();

  const { data, error } = await db
    .from("icp_config")
    .update({ description, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
