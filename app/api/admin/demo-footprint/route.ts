import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";
import { fetchPublicFootprint } from "@/lib/fetch-public-footprint";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();
  try {
    const { demoId } = await req.json() as { demoId: string };
    if (!demoId) return NextResponse.json({ error: "Missing demoId" }, { status: 400 });

    const { data: demo } = await adminClient
      .from("demo_requests")
      .select("id, company_name, website_url, insights_snapshot")
      .eq("id", demoId)
      .single();

    if (!demo)              return NextResponse.json({ error: "Demo not found" }, { status: 404 });
    if (!demo.website_url)  return NextResponse.json({ error: "No website URL on this demo request" }, { status: 400 });

    const result = await fetchPublicFootprint(demo.website_url, demo.company_name);

    // Merge into existing insights_snapshot — preserve versions + approved_pdf_path
    const existing = (demo.insights_snapshot ?? {}) as Record<string, unknown>;
    const updated  = {
      ...existing,
      footprint_cache: {
        content:    result.content,
        sources:    result.sources,
        quality:    result.quality,
        fetched_at: new Date().toISOString(),
      },
    };

    await adminClient
      .from("demo_requests")
      .update({ insights_snapshot: updated, scan_quality: result.quality })
      .eq("id", demoId);

    return NextResponse.json({
      success:      true,
      quality:      result.quality,
      sources:      result.sources,
      pagesScanned: result.pagesScanned,
    });

  } catch (err) {
    await logError({ error: err, source: "api/admin/demo-footprint", action: "POST", metadata: {} });
    return NextResponse.json({ error: "Intelligence gathering failed. Please try again." }, { status: 500 });
  }
}
