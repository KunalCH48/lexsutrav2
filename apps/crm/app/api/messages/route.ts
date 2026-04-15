import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

// POST /api/messages — save a message to prospect_messages or job_messages
export async function POST(req: NextRequest) {
  const { recordId, recordType, label, content } = await req.json();

  if (!recordId || !recordType || !content) {
    return NextResponse.json({ error: "recordId, recordType, and content required" }, { status: 400 });
  }

  const db = createSupabaseAdminClient();
  const table = recordType === "prospect" ? "prospect_messages" : "job_messages";
  const fkField = recordType === "prospect" ? "prospect_id" : "job_id";

  const { data, error } = await db
    .from(table)
    .insert({ [fkField]: recordId, label: label || null, content })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/messages?id=X&type=prospect
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  if (!id || !type) return NextResponse.json({ error: "id and type required" }, { status: 400 });

  const db = createSupabaseAdminClient();
  const table = type === "prospect" ? "prospect_messages" : "job_messages";

  const { error } = await db.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
