import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";
import { SnapshotPDF, type StructuredReport } from "@/lib/snapshot-pdf";

export const runtime = "nodejs";
export const maxDuration = 60; // PDF generation can take a moment

type InsightVersion = {
  v: number;
  content: string;
  generated_at: string;
  internal_feedback: string | null;
};

type InsightsSnapshot = {
  versions: InsightVersion[];
  approved_pdf_path?: string;
};

// ── POST — generate PDF from latest approved snapshot ──────────────

export async function POST(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();

  try {
    const body = await req.json() as { demoId: string };
    const { demoId } = body;
    if (!demoId) return NextResponse.json({ error: "Missing demoId" }, { status: 400 });

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
      return NextResponse.json({ error: "No snapshot version found. Generate a snapshot first." }, { status: 400 });
    }

    // Parse structured report from content
    let report: StructuredReport;
    try {
      const parsed = JSON.parse(latest.content);
      if (!parsed || !Array.isArray(parsed.obligations)) {
        throw new Error("Not structured");
      }
      report = parsed as StructuredReport;
    } catch {
      return NextResponse.json({ error: "Snapshot content is not a structured report. Regenerate the snapshot." }, { status: 400 });
    }

    // Generate a report reference (use demoId-derived if no DB ref available)
    const reportRef = `LSR-${new Date().getFullYear()}-${demoId.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
    const assessmentDate = new Date(latest.generated_at).toLocaleDateString("en-GB", {
      day: "2-digit", month: "long", year: "numeric",
    });
    const fileName   = `${demo.company_name.replace(/[^a-z0-9]/gi, "_")}_LexSutra_Snapshot_${reportRef}.pdf`;
    const storagePath = `snapshots/${demoId}/${fileName}`;

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(SnapshotPDF, {
        report,
        companyName: demo.company_name,
        reportRef,
        assessmentDate,
      }) as unknown as React.ReactElement<DocumentProps>
    );

    // Ensure demo-reports bucket exists (create if not)
    const { data: buckets } = await adminClient.storage.listBuckets();
    const bucketExists = buckets?.some((b: { name: string }) => b.name === "demo-reports");
    if (!bucketExists) {
      await adminClient.storage.createBucket("demo-reports", { public: false });
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await adminClient.storage
      .from("demo-reports")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      await logError({
        error: uploadError,
        source: "api/admin/demo-pdf",
        action: "POST:upload",
        metadata: { demoId, storagePath },
      });
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Store path in insights_snapshot
    const updatedSnapshot: InsightsSnapshot = {
      ...snapshot,
      approved_pdf_path: storagePath,
    };

    await adminClient
      .from("demo_requests")
      .update({ insights_snapshot: updatedSnapshot })
      .eq("id", demoId);

    // Generate a 24-hour signed URL for immediate download
    const { data: signedData, error: signedErr } = await adminClient.storage
      .from("demo-reports")
      .createSignedUrl(storagePath, 60 * 60 * 24); // 24h

    if (signedErr || !signedData) {
      await logError({ error: signedErr ?? new Error("No signed URL"), source: "api/admin/demo-pdf", action: "POST:signedUrl", metadata: { demoId } });
      return NextResponse.json({ error: "PDF saved but could not generate download URL." }, { status: 500 });
    }

    return NextResponse.json({
      success:    true,
      url:        signedData.signedUrl,
      path:       storagePath,
      fileName,
      reportRef,
    });

  } catch (err) {
    await logError({ error: err, source: "api/admin/demo-pdf", action: "POST", metadata: {} });
    return NextResponse.json({ error: "PDF generation failed. Please try again." }, { status: 500 });
  }
}

// ── GET — return a fresh signed URL for an existing PDF ────────────

export async function GET(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();

  try {
    const demoId = req.nextUrl.searchParams.get("demoId");
    if (!demoId) return NextResponse.json({ error: "Missing demoId" }, { status: 400 });

    const { data: demo } = await adminClient
      .from("demo_requests")
      .select("insights_snapshot")
      .eq("id", demoId)
      .single();

    const snapshot = (demo?.insights_snapshot ?? {}) as InsightsSnapshot;
    const path     = snapshot.approved_pdf_path;

    if (!path) {
      return NextResponse.json({ error: "No PDF found for this demo." }, { status: 404 });
    }

    const { data: signedData, error: signedErr } = await adminClient.storage
      .from("demo-reports")
      .createSignedUrl(path, 60 * 60 * 24); // 24h

    if (signedErr || !signedData) {
      return NextResponse.json({ error: "Could not generate download URL." }, { status: 500 });
    }

    return NextResponse.json({ url: signedData.signedUrl, path });

  } catch (err) {
    await logError({ error: err, source: "api/admin/demo-pdf", action: "GET", metadata: {} });
    return NextResponse.json({ error: "Failed to retrieve PDF." }, { status: 500 });
  }
}
