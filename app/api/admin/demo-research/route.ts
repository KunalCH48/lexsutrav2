import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

type ResearchFile = { path: string; name: string; size: number };

async function getFiles(adminClient: ReturnType<typeof createSupabaseAdminClient>, demoId: string): Promise<ResearchFile[]> {
  const { data } = await adminClient
    .from("demo_requests")
    .select("research_files")
    .eq("id", demoId)
    .single();
  return (data?.research_files as ResearchFile[]) ?? [];
}

// ── PUT — register a file in DB after browser uploads directly to Supabase ────

export async function PUT(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();
  try {
    const { demoId, path, name, size } = await req.json() as { demoId: string; path: string; name: string; size: number };
    if (!demoId || !path || !name) {
      return NextResponse.json({ error: "Missing demoId, path, or name." }, { status: 400 });
    }

    const current = await getFiles(adminClient, demoId);
    const { error: dbErr } = await adminClient
      .from("demo_requests")
      .update({ research_files: [...current, { path, name, size }] })
      .eq("id", demoId);
    if (dbErr) return NextResponse.json({ error: "Failed to register file." }, { status: 500 });

    return NextResponse.json({ success: true, path, name, size });
  } catch (err) {
    await logError({ error: err, source: "api/admin/demo-research", action: "PUT", metadata: {} });
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}

// ── DELETE — remove one file ──────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();
  try {
    const { demoId, path } = await req.json() as { demoId: string; path: string };
    if (!demoId || !path) return NextResponse.json({ error: "Missing demoId or path." }, { status: 400 });

    await adminClient.storage.from("documents").remove([path]);

    const current = await getFiles(adminClient, demoId);
    await adminClient
      .from("demo_requests")
      .update({ research_files: current.filter((f) => f.path !== path) })
      .eq("id", demoId);

    return NextResponse.json({ success: true });
  } catch (err) {
    await logError({ error: err, source: "api/admin/demo-research", action: "DELETE", metadata: {} });
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}

// ── PATCH — save manually edited research brief ───────────────────────────────

export async function PATCH(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();
  try {
    const { demoId, research_brief } = await req.json() as { demoId: string; research_brief: string };
    if (!demoId) return NextResponse.json({ error: "Missing demoId." }, { status: 400 });

    const { error: dbErr } = await adminClient.from("demo_requests").update({ research_brief }).eq("id", demoId);
    if (dbErr) return NextResponse.json({ error: "Failed to save brief." }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    await logError({ error: err, source: "api/admin/demo-research", action: "PATCH", metadata: {} });
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }
}
