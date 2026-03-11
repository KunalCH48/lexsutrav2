import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

const BUCKET   = "documents";
const MAX_SIZE = 4 * 1024 * 1024; // 4 MB — Vercel serverless body limit

type ResearchFile = { path: string; name: string; size: number };

async function getFiles(adminClient: ReturnType<typeof createSupabaseAdminClient>, demoId: string): Promise<ResearchFile[]> {
  const { data } = await adminClient
    .from("demo_requests")
    .select("research_files")
    .eq("id", demoId)
    .single();
  return (data?.research_files as ResearchFile[]) ?? [];
}

// ── POST — upload one PDF ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();
  try {
    const formData = await req.formData();
    const file   = formData.get("file")   as File   | null;
    const demoId = formData.get("demoId") as string | null;

    if (!file || !demoId) {
      return NextResponse.json({ error: "Missing file or demoId." }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large — maximum 4 MB per file." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const clean  = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path   = `demo-research/${demoId}/${Date.now()}_${clean}`;

    const { error: uploadErr } = await adminClient.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: "application/pdf", upsert: false });

    if (uploadErr) {
      return NextResponse.json({ error: `Storage upload failed: ${uploadErr.message}` }, { status: 500 });
    }

    const current  = await getFiles(adminClient, demoId);
    const newFile: ResearchFile = { path, name: file.name, size: file.size };
    const updated  = [...current, newFile];

    await adminClient.from("demo_requests").update({ research_files: updated }).eq("id", demoId);

    return NextResponse.json({ success: true, ...newFile });
  } catch (err) {
    await logError({ error: err, source: "api/admin/demo-research", action: "POST", metadata: {} });
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}

// ── DELETE — remove one file ──────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();
  try {
    const { demoId, path } = await req.json() as { demoId: string; path: string };
    if (!demoId || !path) return NextResponse.json({ error: "Missing demoId or path." }, { status: 400 });

    await adminClient.storage.from(BUCKET).remove([path]);

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

    await adminClient.from("demo_requests").update({ research_brief }).eq("id", demoId);
    return NextResponse.json({ success: true });
  } catch (err) {
    await logError({ error: err, source: "api/admin/demo-research", action: "PATCH", metadata: {} });
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }
}
