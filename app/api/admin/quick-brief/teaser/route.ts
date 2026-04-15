import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";
import { TeaserPDF } from "@/lib/teaser-pdf";
import type { StructuredReport } from "@/lib/snapshot-pdf";

export const runtime    = "nodejs";
export const maxDuration = 60;

// ── POST — generate 1-page teaser PDF for one selected obligation ──

export async function POST(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();

  try {
    const body = await req.json() as {
      demoId:         string;
      obligationIndex: number; // 0-based index into report.obligations
      companyName:    string;
      reportRef:      string;
      assessmentDate: string;
    };
    const { demoId, obligationIndex, companyName, reportRef, assessmentDate } = body;

    if (!demoId || obligationIndex === undefined || !companyName) {
      return NextResponse.json({ error: "demoId, obligationIndex and companyName are required" }, { status: 400 });
    }

    // ── Fetch saved report ─────────────────────────────────────────
    const { data: demo } = await adminClient
      .from("demo_requests")
      .select("insights_snapshot")
      .eq("id", demoId)
      .single();

    const briefData = (demo?.insights_snapshot as { brief_data?: { report: StructuredReport; reportRef: string; assessmentDate: string } } | null)?.brief_data;
    if (!briefData?.report) {
      return NextResponse.json({ error: "No analysis found. Run analysis first." }, { status: 400 });
    }

    const report     = briefData.report;
    const obligation = report.obligations[obligationIndex];
    if (!obligation) {
      return NextResponse.json({ error: "Obligation not found." }, { status: 400 });
    }

    const obligations    = report.obligations ?? [];
    const criticalCount  = obligations.filter(o => o.status === "critical_gap").length;

    // ── Generate teaser PDF ────────────────────────────────────────
    const pdfBuffer = await renderToBuffer(
      React.createElement(TeaserPDF, {
        obligation,
        companyName,
        reportRef:      briefData.reportRef ?? reportRef,
        assessmentDate: briefData.assessmentDate ?? assessmentDate,
        totalCount:     obligations.length,
        criticalCount,
      }) as unknown as React.ReactElement<DocumentProps>
    );

    // ── Upload to storage ──────────────────────────────────────────
    const safeName    = companyName.replace(/[^a-z0-9]/gi, "_");
    const fileName    = `${safeName}_LexSutra_Teaser_${briefData.reportRef ?? reportRef}.pdf`;
    const storagePath = `teasers/${demoId}/${fileName}`;

    const { data: buckets } = await adminClient.storage.listBuckets();
    if (!buckets?.some(b => b.name === "demo-reports")) {
      await adminClient.storage.createBucket("demo-reports", { public: false });
    }

    const { error: uploadError } = await adminClient.storage
      .from("demo-reports")
      .upload(storagePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      await logError({ error: uploadError, source: "api/admin/quick-brief/teaser", action: "POST:upload", metadata: { demoId, storagePath } });
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // ── Save teaser reference to demo_requests ─────────────────────
    await adminClient
      .from("demo_requests")
      .update({
        insights_snapshot: {
          ...(demo?.insights_snapshot ?? {}),
          brief_data: {
            ...briefData,
            teaser: { obligationIndex, storagePath, fileName },
          },
        },
      })
      .eq("id", demoId);

    // ── Return signed preview URL ──────────────────────────────────
    const { data: signedData } = await adminClient.storage
      .from("demo-reports")
      .createSignedUrl(storagePath, 60 * 60);

    return NextResponse.json({
      success:     true,
      storagePath,
      fileName,
      previewUrl:  signedData?.signedUrl ?? null,
      obligation,
    });

  } catch (err) {
    await logError({ error: err, source: "api/admin/quick-brief/teaser", action: "POST", metadata: {} });
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Teaser generation failed: ${msg}` }, { status: 500 });
  }
}
