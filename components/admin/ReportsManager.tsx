"use client";

import { useState, useTransition } from "react";
import { deleteReport } from "@/app/admin/(dashboard)/reports/actions";

type ReportEntry = {
  demoId:      string;
  companyName: string;
  email:       string;
  storagePath: string;
  grade:       string;
  generatedAt: string | null;
  fileName:    string;
};

const GRADE_COLOR: Record<string, string> = {
  "A+": "#2ecc71", A: "#2ecc71",
  "B+": "#5bb8f0", B: "#5bb8f0",
  "C+": "#e0a832", C: "#e0a832",
  D: "#e05252", F: "#e05252",
};

export default function ReportsManager({ reports: initial }: { reports: ReportEntry[] }) {
  const [reports, setReports] = useState<ReportEntry[]>(initial);
  const [feedback, setFeedback] = useState<Record<string, { type: "success" | "error"; message: string }>>({});
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  function handleDownload(demoId: string, fileName: string) {
    setDownloading((p) => ({ ...p, [demoId]: true }));
    fetch(`/api/admin/demo-pdf?demoId=${demoId}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error ?? "Failed to get download URL");
        const a = document.createElement("a");
        a.href = json.url;
        a.download = fileName;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.click();
      })
      .catch((err) => {
        setFeedback((p) => ({ ...p, [demoId]: { type: "error", message: err.message } }));
      })
      .finally(() => {
        setDownloading((p) => ({ ...p, [demoId]: false }));
      });
  }

  function handleDelete(demoId: string, storagePath: string) {
    if (!confirm("Delete this PDF from storage? This cannot be undone.\n\nThe analysis data is still kept — you can regenerate the PDF anytime.")) return;
    startTransition(async () => {
      const result = await deleteReport(demoId, storagePath);
      if ("error" in result) {
        setFeedback((p) => ({ ...p, [demoId]: { type: "error", message: result.error } }));
      } else {
        setReports((prev) => prev.filter((r) => r.demoId !== demoId));
      }
    });
  }

  if (reports.length === 0) {
    return (
      <div
        className="rounded-xl p-12 text-center"
        style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-sm" style={{ color: "#3d4f60" }}>No generated PDFs yet.</p>
        <p className="text-xs mt-2" style={{ color: "#3d4f60" }}>
          PDFs are saved here after you click &ldquo;Save PDF&rdquo; on a demo request.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((r) => {
        const fb   = feedback[r.demoId];
        const isDown = downloading[r.demoId];
        const gradeColor = GRADE_COLOR[r.grade] ?? "#8899aa";
        const date = r.generatedAt
          ? new Date(r.generatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
          : "—";
        const time = r.generatedAt
          ? new Date(r.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
          : "";

        return (
          <div
            key={r.demoId}
            className="rounded-xl p-5 flex items-center gap-5"
            style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {/* Grade badge */}
            <div
              className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold"
              style={{
                background: `${gradeColor}14`,
                border: `1px solid ${gradeColor}40`,
                color: gradeColor,
              }}
            >
              {r.grade}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "#e8f4ff" }}>
                {r.companyName}
              </p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "#3d4f60" }}>
                {r.email}
              </p>
              <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>
                Generated {date} {time && <span style={{ color: "#2d5060" }}>at {time}</span>}
              </p>
              {fb && (
                <p
                  className="text-xs mt-1"
                  style={{ color: fb.type === "error" ? "#e05252" : "#2ecc71" }}
                >
                  {fb.message}
                </p>
              )}
            </div>

            {/* File name */}
            <div className="hidden md:block text-xs truncate max-w-[180px] shrink-0" style={{ color: "#3d4f60" }}>
              {r.fileName}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleDownload(r.demoId, r.fileName)}
                disabled={isDown}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{
                  background: "rgba(45,156,219,0.1)",
                  border:     "1px solid rgba(45,156,219,0.25)",
                  color:      "#2d9cdb",
                }}
              >
                {isDown ? "…" : "↓ Download"}
              </button>
              <button
                onClick={() => handleDelete(r.demoId, r.storagePath)}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{
                  background: "rgba(224,82,82,0.08)",
                  border:     "1px solid rgba(224,82,82,0.2)",
                  color:      "#e05252",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
