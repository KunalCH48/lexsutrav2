import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";
import { RiskBriefPDF, type ObligationItem } from "@/lib/risk-brief-pdf";

export const runtime    = "nodejs";
export const maxDuration = 60;

type StructuredReport = {
  risk_classification: string;
  risk_tier:           string;
  annex_section:       string;
  obligations:         ObligationItem[];
};

type InsightVersion = {
  v:            number;
  content:      string;
  generated_at: string;
};

type InsightsSnapshot = {
  versions: InsightVersion[];
};

export async function POST(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();

  try {
    const body = await req.json() as { demoId: string; obligationNumbers: string[] };
    const { demoId, obligationNumbers } = body;

    if (!demoId) {
      return NextResponse.json({ error: "Missing demoId" }, { status: 400 });
    }
    if (!Array.isArray(obligationNumbers) || obligationNumbers.length !== 2) {
      return NextResponse.json({ error: "Exactly 2 obligation numbers required" }, { status: 400 });
    }

    // Load demo request
    const { data: demo, error: demoErr } = await adminClient
      .from("demo_requests")
      .select("id, company_name, insights_snapshot")
      .eq("id", demoId)
      .single();

    if (demoErr || !demo) {
      return NextResponse.json({ error: "Demo request not found" }, { status: 404 });
    }

    const snapshot = (demo.insights_snapshot ?? { versions: [] }) as InsightsSnapshot;
    const versions = snapshot.versions ?? [];
    const latest   = versions[versions.length - 1];

    if (!latest) {
      return NextResponse.json({ error: "No snapshot found. Generate an AI analysis first." }, { status: 400 });
    }

    // Parse report
    let report: StructuredReport;
    try {
      const parsed = JSON.parse(latest.content);
      if (!parsed || !Array.isArray(parsed.obligations)) {
        throw new Error("Not structured");
      }
      report = parsed as StructuredReport;
    } catch {
      return NextResponse.json({ error: "Snapshot is not a structured report. Regenerate the analysis." }, { status: 400 });
    }

    // Filter to selected obligations
    const selected = report.obligations.filter((ob) =>
      obligationNumbers.includes(ob.number)
    );

    if (selected.length !== 2) {
      return NextResponse.json({
        error: `Could not find both selected obligations in the snapshot. Found: ${selected.map((o) => o.number).join(", ")}`,
      }, { status: 400 });
    }

    // Build meta
    const reportRef      = `LRB-${new Date().getFullYear()}-${demoId.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
    const assessmentDate = new Date(latest.generated_at).toLocaleDateString("en-GB", {
      day: "2-digit", month: "long", year: "numeric",
    });

    // Render PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(RiskBriefPDF, {
        companyName:       demo.company_name,
        riskClassification: report.risk_classification,
        riskTier:          report.risk_tier,
        annexSection:      report.annex_section,
        obligations:       selected,
        reportRef,
        assessmentDate,
      }) as unknown as React.ReactElement<DocumentProps>
    );

    const fileName = `${demo.company_name.replace(/[^a-z0-9]/gi, "_")}_LexSutra_Risk_Brief_${reportRef}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length":      pdfBuffer.byteLength.toString(),
      },
    });

  } catch (err) {
    await logError({ error: err, source: "api/admin/risk-brief", action: "POST", metadata: {} });
    return NextResponse.json({ error: "PDF generation failed. Please try again." }, { status: 500 });
  }
}
