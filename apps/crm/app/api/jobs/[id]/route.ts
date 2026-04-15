import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createSupabaseAdminClient();

  const [jobRes, messagesRes] = await Promise.all([
    db.from("job_applications").select("*").eq("id", id).single(),
    db.from("job_messages").select("*").eq("job_id", id).order("created_at", { ascending: false }),
  ]);

  if (jobRes.error) return NextResponse.json({ error: jobRes.error.message }, { status: 404 });
  return NextResponse.json({ ...jobRes.data, messages: messagesRes.data ?? [] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const db = createSupabaseAdminClient();

  const { data, error } = await db
    .from("job_applications")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createSupabaseAdminClient();

  const { error } = await db.from("job_applications").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
