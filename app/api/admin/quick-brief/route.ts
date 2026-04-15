import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";
import type { StructuredReport } from "@/lib/snapshot-pdf";
import { SYSTEM_INITIAL, extractEvidence } from "@/lib/compliance-analysis";

export const runtime    = "nodejs";
export const maxDuration = 120;

const anthropic = new Anthropic();

// ── POST — analyse only (no PDF) — saves report to demo_requests ───

export async function POST(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();

  try {
    const body = await req.json() as { companyName: string; websiteUrl?: string; demoId?: string };
    const { companyName, websiteUrl, demoId } = body;

    if (!companyName?.trim()) {
      return NextResponse.json({ error: "companyName is required" }, { status: 400 });
    }

    // ── Step 1: Fetch website ──────────────────────────────────────
    let websiteContent = "";
    let scanQuality: "good" | "partial" | "failed" = "failed";

    if (websiteUrl?.trim()) {
      const { fetchWebsite } = await import("@/lib/fetch-website");
      const result   = await fetchWebsite(websiteUrl.trim());
      websiteContent = result.content;
      scanQuality    = result.quality;
    }

    const assessmentDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit", month: "long", year: "numeric",
    });

    // ── Step 2: Evidence extraction (Haiku pass) ───────────────────
    const lockedEvidence = websiteContent
      ? await extractEvidence(websiteContent, companyName)
      : "";

    // ── Step 3: Build Claude user message ─────────────────────────
    const footprintSection = scanQuality === "failed"
      ? "\n\nPublic footprint: Website inaccessible — limited public information available."
      : `\n\nPublic footprint content (${scanQuality} scan):\n\n${websiteContent}`;

    const lockedEvidenceSection = lockedEvidence
      ? `\n\nLOCKED EVIDENCE — Pre-extracted and verified by Pass 1. Assign all obligation statuses based on this evidence only:\n${lockedEvidence}`
      : "";

    const userMessage =
      `Company name: ${companyName}\nWebsite: ${websiteUrl ?? "(not provided)"}` +
      `${footprintSection}${lockedEvidenceSection}\n\nAssessment date: ${assessmentDate}\n\nGenerate the full diagnostic snapshot report JSON.`;

    // ── Step 4: Claude Sonnet full analysis ───────────────────────
    const message = await anthropic.messages.create({
      model:       "claude-sonnet-4-6",
      max_tokens:  8192,
      temperature: 0,
      system:      SYSTEM_INITIAL,
      messages:    [{ role: "user", content: userMessage }],
    });

    let rawContent = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map(b => b.text).join("").trim()
      .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    let report: StructuredReport;
    try {
      report = JSON.parse(rawContent) as StructuredReport;
      if (!Array.isArray(report.obligations)) throw new Error("missing obligations");
    } catch {
      await logError({ error: new Error("Claude returned invalid JSON"), source: "api/admin/quick-brief", action: "POST:parse", metadata: { companyName, rawContent: rawContent.slice(0, 500) } });
      return NextResponse.json({ error: "Analysis produced invalid output. Please try again." }, { status: 500 });
    }

    const reportRef = `LSR-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-4)}`;

    // ── Step 5: Save analysis to demo_requests ─────────────────────
    if (demoId) {
      const { data: existing } = await adminClient
        .from("demo_requests")
        .select("insights_snapshot")
        .eq("id", demoId)
        .single();

      await adminClient
        .from("demo_requests")
        .update({
          insights_snapshot: {
            ...(existing?.insights_snapshot ?? {}),
            brief_data: { report, reportRef, assessmentDate, generatedAt: new Date().toISOString() },
          },
        })
        .eq("id", demoId);
    }

    const obligations    = report.obligations ?? [];
    const criticalCount  = obligations.filter(o => o.status === "critical_gap").length;
    const partialCount   = obligations.filter(o => o.status === "partial").length;
    const compliantCount = obligations.filter(o => o.status === "compliant").length;

    return NextResponse.json({
      success: true,
      report,
      reportRef,
      assessmentDate,
      grade:        report.grade,
      criticalCount,
      partialCount,
      compliantCount,
    });

  } catch (err) {
    await logError({ error: err, source: "api/admin/quick-brief", action: "POST", metadata: {} });
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Analysis failed: ${msg}` }, { status: 500 });
  }
}
