import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";
import { SnapshotPDF, type StructuredReport } from "@/lib/snapshot-pdf";
import { SYSTEM_INITIAL, extractEvidence } from "@/lib/compliance-analysis";

export const runtime = "nodejs";
export const maxDuration = 120;

const anthropic = new Anthropic();

// ── POST — analyse + generate PDF + upload to temp storage ─────────

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
      const result = await fetchWebsite(websiteUrl.trim());
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
      .map((b) => b.text).join("").trim();
    rawContent = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let report: StructuredReport;
    try {
      report = JSON.parse(rawContent) as StructuredReport;
    } catch {
      await logError({
        error: new Error("Claude returned invalid JSON"),
        source: "api/admin/quick-brief",
        action: "POST:parse",
        metadata: { companyName, rawContent: rawContent.slice(0, 500) },
      });
      return NextResponse.json(
        { error: "Analysis produced invalid output. Please try again." },
        { status: 500 }
      );
    }

    // ── Step 5: Generate PDF ───────────────────────────────────────
    const reportRef = `LSR-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-4)}`;

    const pdfBuffer = await renderToBuffer(
      React.createElement(SnapshotPDF, {
        report,
        companyName,
        reportRef,
        assessmentDate,
      }) as unknown as React.ReactElement<DocumentProps>
    );

    // ── Step 6: Upload to temp storage ────────────────────────────
    const fileName    = `${companyName.replace(/[^a-z0-9]/gi, "_")}_LexSutra_Brief_${reportRef}.pdf`;
    const storagePath = `quick-briefs/${Date.now()}-${fileName}`;

    // Ensure bucket exists
    const { data: buckets } = await adminClient.storage.listBuckets();
    const bucketExists = buckets?.some((b: { name: string }) => b.name === "demo-reports");
    if (!bucketExists) {
      await adminClient.storage.createBucket("demo-reports", { public: false });
    }

    const { error: uploadError } = await adminClient.storage
      .from("demo-reports")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      await logError({
        error: uploadError,
        source: "api/admin/quick-brief",
        action: "POST:upload",
        metadata: { companyName, storagePath },
      });
      return NextResponse.json(
        { error: `PDF upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // ── Step 7: Save brief reference to demo_requests ─────────────
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
            brief_data: {
              storagePath,
              fileName,
              grade:        report.grade,
              reportRef,
              criticalCount: (report.obligations ?? []).filter((o: { status: string }) => o.status === "critical_gap").length,
              partialCount:  (report.obligations ?? []).filter((o: { status: string }) => o.status === "partial").length,
              compliantCount:(report.obligations ?? []).filter((o: { status: string }) => o.status === "compliant").length,
            },
          },
        })
        .eq("id", demoId);
    }

    // ── Step 8: Build email draft ──────────────────────────────────
    const obligations   = report.obligations ?? [];
    const criticalCount = obligations.filter(o => o.status === "critical_gap").length;
    const partialCount  = obligations.filter(o => o.status === "partial").length;
    const compliantCount = obligations.filter(o => o.status === "compliant").length;

    const emailSubject  = `LexSutra Compliance Brief — ${companyName} [${reportRef}]`;
    const emailBodyText = buildEmailBodyText({
      companyName,
      grade:              report.grade,
      riskClassification: report.risk_classification,
      criticalCount,
      reportRef,
    });

    // Generate a 1-hour signed URL so admin can preview before sending
    const { data: signedData } = await adminClient.storage
      .from("demo-reports")
      .createSignedUrl(storagePath, 60 * 60);

    return NextResponse.json({
      success:          true,
      grade:            report.grade,
      riskClassification: report.risk_classification,
      criticalCount,
      partialCount,
      compliantCount,
      reportRef,
      assessmentDate,
      storagePath,
      fileName,
      previewUrl:   signedData?.signedUrl ?? null,
      emailSubject,
      emailBodyText,
    });

  } catch (err) {
    await logError({ error: err, source: "api/admin/quick-brief", action: "POST", metadata: {} });
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Brief generation failed: ${msg}` }, { status: 500 });
  }
}

// ── Helpers ───────────────────────────────────────────────────────

function buildEmailBodyText({
  companyName,
  grade,
  riskClassification,
  criticalCount,
  reportRef,
}: {
  companyName:        string;
  grade:              string;
  riskClassification: string;
  criticalCount:      number;
  reportRef:          string;
}): string {
  const goodGrades = ["A+", "A", "B+", "B"];
  const urgencyNote = criticalCount > 0
    ? `Our initial analysis flags ${criticalCount} critical area${criticalCount !== 1 ? "s" : ""} that will require action before the August 2026 deadline.`
    : goodGrades.includes(grade)
      ? "Your initial compliance posture is encouraging — the attached brief has the full picture."
      : "The attached brief outlines the specific gaps and the steps needed to address them before the August 2026 deadline.";

  const riskShort = riskClassification.split("—")[0]?.trim() ?? riskClassification;

  return `Hi,

I've completed a preliminary EU AI Act compliance snapshot for ${companyName} and wanted to share it directly.

Based on publicly available information, ${companyName} receives an initial compliance grade of ${grade}. ${riskShort}. ${urgencyNote}

The full compliance brief is attached to this email (ref: ${reportRef}). It covers all eight mandatory obligations of the EU AI Act and outlines the specific steps needed to reach compliance.

This is a public-footprint snapshot — a starting point before a full diagnostic engagement. If the findings are useful, I'd be happy to walk through them on a brief call and discuss what a full diagnostic would look like for your team.

The August 2026 deadline is closer than most companies realise.

Kind regards,
Kunal Chaudhari
LexSutra — AI Compliance Diagnostic Infrastructure
kunal@lexsutra.com · lexsutra.com · Netherlands`;
}
