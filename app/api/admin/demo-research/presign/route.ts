import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

const BUCKET   = "documents";
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB — browser uploads directly to Supabase

export async function POST(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();
  try {
    const { demoId, filename, size } = await req.json() as { demoId: string; filename: string; size: number };

    if (!demoId || !filename) {
      return NextResponse.json({ error: "Missing demoId or filename." }, { status: 400 });
    }
    if (!filename.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
    }
    if (size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large — maximum 20 MB per file." }, { status: 400 });
    }

    const clean = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path  = `demo-research/${demoId}/${Date.now()}_${clean}`;

    const { data, error } = await adminClient.storage.from(BUCKET).createSignedUploadUrl(path);

    if (error || !data) {
      return NextResponse.json({ error: `Could not generate upload URL: ${error?.message}` }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path, name: filename, size });

  } catch (err) {
    await logError({ error: err, source: "api/admin/demo-research/presign", action: "POST", metadata: {} });
    return NextResponse.json({ error: "Failed to generate upload URL." }, { status: 500 });
  }
}
