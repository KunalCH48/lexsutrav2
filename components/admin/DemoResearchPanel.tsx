"use client";

import { useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type ResearchFile = {
  path: string;
  name: string;
  size: number;
};

type FootprintSources = {
  websiteQuality: "good" | "partial" | "failed";
  newsCount: number;
  linkedInFound: boolean;
  linkedInJobsFound: boolean;
  crunchbaseFound: boolean;
};

type Props = {
  demoId: string;
  initialFiles: ResearchFile[];
  initialBrief: string | null;
  footprintSources?: FootprintSources | null;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function displayName(path: string, originalName?: string) {
  if (originalName) return originalName;
  const segment = path.split("/").pop() ?? path;
  return segment.replace(/^\d+_/, "");
}

const PRIORITY_PAGES: {
  label: string;
  hint: string;
  why: string;
  autoKey?: keyof FootprintSources;
  critical?: boolean;
}[] = [
  { label: "Privacy Policy",        hint: "/privacy or /data-policy",       why: "Data governance (Art. 10)",         critical: true  },
  { label: "Terms of Service",       hint: "/terms or /legal",               why: "Usage restrictions, liability",      critical: true  },
  { label: "Product / Solutions",    hint: "/product or /features",          why: "AI capability claims",               critical: true  },
  { label: "Responsible AI / Ethics",hint: "/responsible-ai or /ethics",     why: "Risk management (Art. 9)"                            },
  { label: "About / Team",           hint: "/about or /company",             why: "Background, expertise context"                       },
  { label: "Technical Docs / API",   hint: "/docs or /api",                  why: "Technical documentation (Art. 11)"                   },
  { label: "LinkedIn Company",       hint: "linkedin.com/company/…",         why: "Team size, AI job roles", autoKey: "linkedInFound"    },
  { label: "LinkedIn Jobs",          hint: "linkedin.com/company/…/jobs",    why: "AI/ML hiring = deployment evidence", autoKey: "linkedInJobsFound" },
  { label: "Crunchbase",             hint: "crunchbase.com/organization/…",  why: "Funding, investors",                 autoKey: "crunchbaseFound"   },
  { label: "Blog / AI articles",     hint: "/blog — filter AI/compliance",   why: "Thought leadership, policy stance"                   },
];

export default function DemoResearchPanel({ demoId, initialFiles, initialBrief, footprintSources }: Props) {
  const [files, setFiles]           = useState<ResearchFile[]>(initialFiles);
  const [brief, setBrief]           = useState(initialBrief ?? "");
  const [briefDirty, setBriefDirty] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [summarising, setSummarising] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const inputRef                    = useRef<HTMLInputElement>(null);

  async function handleFiles(selected: FileList | null) {
    if (!selected || selected.length === 0) return;
    if (files.length + selected.length > 20) {
      setError("Maximum 20 files per lead.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    const supabase = createSupabaseBrowserClient();

    for (const file of Array.from(selected)) {
      try {
        // 1. Get presigned upload URL from server
        const presignRes  = await fetch("/api/admin/demo-research/presign", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ demoId, filename: file.name, size: file.size }),
        });
        const presignData = await presignRes.json();
        if (!presignRes.ok || presignData.error) {
          setError(presignData.error ?? "Upload failed.");
          continue;
        }

        // 2. Upload directly from browser to Supabase Storage (bypasses Vercel size limit)
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .uploadToSignedUrl(presignData.path, presignData.token, file, { contentType: "application/pdf" });
        if (uploadError) {
          setError(`Upload failed: ${uploadError.message}`);
          continue;
        }

        // 3. Register file in DB
        const registerRes  = await fetch("/api/admin/demo-research", {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ demoId, path: presignData.path, name: file.name, size: file.size }),
        });
        const registerData = await registerRes.json();
        if (!registerRes.ok || registerData.error) {
          setError(registerData.error ?? "Registration failed.");
          continue;
        }

        setFiles((prev) => [...prev, { path: presignData.path, name: file.name, size: file.size }]);
      } catch {
        setError("Network error. Please try again.");
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete(path: string) {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/demo-research", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId, path }),
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.path !== path));
      }
    } catch {
      setError("Delete failed.");
    }
  }

  async function handleSummarise() {
    if (files.length === 0) {
      setError("Upload at least one file before summarising.");
      return;
    }
    setSummarising(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res  = await fetch("/api/admin/demo-research/summarise", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ demoId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Summarisation failed.");
      } else {
        setBrief(data.brief);
        setBriefDirty(false);
        setSuccessMsg(`Research brief generated from ${data.filesRead} file${data.filesRead !== 1 ? "s" : ""}${data.filesSkipped?.length ? ` (${data.filesSkipped.length} skipped)` : ""}.`);
      }
    } catch {
      setError("Network error during summarisation.");
    } finally {
      setSummarising(false);
    }
  }

  async function handleSaveBrief() {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/admin/demo-research", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ demoId, research_brief: brief }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Save failed.");
      } else {
        setBriefDirty(false);
        setSuccessMsg("Research brief saved.");
      }
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div
      className="rounded-xl p-6 space-y-5"
      style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
    >
      {/* Header */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d9cdb" }}>
          Phase 1 — Research Files
        </h3>
        <p className="text-xs mt-1" style={{ color: "#3d4f60", lineHeight: 1.6 }}>
          Open each priority page in your browser →{" "}
          <kbd style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, padding: "0 5px", color: "#8899aa" }}>
            Cmd+P
          </kbd>{" "}
          → Save as PDF → upload below. Claude reads each PDF and produces a structured research brief.
          {files.length > 0 && (
            <span style={{ color: "#2d9cdb" }}>{" "}{files.length} file{files.length !== 1 ? "s" : ""} uploaded.</span>
          )}
        </p>
      </div>

      {/* Auto-scan coverage + research checklist */}
      <div
        className="rounded-lg p-4 space-y-3"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Auto-scan status row */}
        {footprintSources && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#3d4f60" }}>
              Auto-scan coverage
            </p>
            <div className="flex flex-wrap gap-1.5">
              {/* Website */}
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: footprintSources.websiteQuality === "good" ? "rgba(46,204,113,0.1)" : footprintSources.websiteQuality === "partial" ? "rgba(224,168,50,0.1)" : "rgba(224,82,82,0.1)",
                  color:      footprintSources.websiteQuality === "good" ? "#2ecc71" : footprintSources.websiteQuality === "partial" ? "#e0a832" : "#e05252",
                  border:     `1px solid ${footprintSources.websiteQuality === "good" ? "rgba(46,204,113,0.25)" : footprintSources.websiteQuality === "partial" ? "rgba(224,168,50,0.25)" : "rgba(224,82,82,0.25)"}`,
                }}
              >
                Website: {footprintSources.websiteQuality === "good" ? "✓ Good" : footprintSources.websiteQuality === "partial" ? "⚡ Partial" : "✗ Failed"}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: footprintSources.newsCount > 0 ? "rgba(46,204,113,0.1)" : "rgba(255,255,255,0.04)",
                  color:      footprintSources.newsCount > 0 ? "#2ecc71" : "#3d4f60",
                  border:     `1px solid ${footprintSources.newsCount > 0 ? "rgba(46,204,113,0.25)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                News: {footprintSources.newsCount > 0 ? `✓ ${footprintSources.newsCount}` : "0 found"}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: footprintSources.linkedInFound ? "rgba(46,204,113,0.1)" : "rgba(255,255,255,0.04)",
                  color:      footprintSources.linkedInFound ? "#2ecc71" : "#3d4f60",
                  border:     `1px solid ${footprintSources.linkedInFound ? "rgba(46,204,113,0.25)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                LinkedIn: {footprintSources.linkedInFound ? "✓" : "—"}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: footprintSources.linkedInJobsFound ? "rgba(46,204,113,0.1)" : "rgba(255,255,255,0.04)",
                  color:      footprintSources.linkedInJobsFound ? "#2ecc71" : "#3d4f60",
                  border:     `1px solid ${footprintSources.linkedInJobsFound ? "rgba(46,204,113,0.25)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                LI Jobs: {footprintSources.linkedInJobsFound ? "✓" : "—"}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: footprintSources.crunchbaseFound ? "rgba(46,204,113,0.1)" : "rgba(255,255,255,0.04)",
                  color:      footprintSources.crunchbaseFound ? "#2ecc71" : "#3d4f60",
                  border:     `1px solid ${footprintSources.crunchbaseFound ? "rgba(46,204,113,0.25)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                Crunchbase: {footprintSources.crunchbaseFound ? "✓" : "—"}
              </span>
            </div>
          </div>
        )}

        {/* Priority page checklist */}
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#3d4f60" }}>
            Priority pages to save manually
          </p>
          <div className="space-y-1 pt-0.5">
            {PRIORITY_PAGES.map((page, i) => {
              const autoFound = page.autoKey && footprintSources
                ? (footprintSources[page.autoKey] as boolean)
                : null;
              return (
                <div key={i} className="flex items-start gap-2.5 py-1">
                  {/* Priority indicator */}
                  <span
                    className="text-xs font-mono mt-0.5 shrink-0 w-5 text-right"
                    style={{ color: page.critical ? "#e0a832" : "#3d4f60" }}
                  >
                    {page.critical ? "!" : i + 1}
                  </span>
                  {/* Label + hint */}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium" style={{ color: page.critical ? "#e8f4ff" : "#8899aa" }}>
                      {page.label}
                    </span>
                    <span className="text-xs ml-1.5" style={{ color: "#3d4f60" }}>
                      {page.hint}
                    </span>
                  </div>
                  {/* Why / auto-found status */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {autoFound === true && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(46,204,113,0.08)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.2)" }}>
                        auto ✓
                      </span>
                    )}
                    {autoFound === false && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "#3d4f60", border: "1px solid rgba(255,255,255,0.08)" }}>
                        manual
                      </span>
                    )}
                    <span className="text-xs" style={{ color: "#3d4f60" }}>{page.why}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg cursor-pointer transition-colors"
        style={{
          border: "1.5px dashed rgba(45,156,219,0.3)",
          padding: "16px 20px",
          textAlign: "center",
          background: "rgba(45,156,219,0.03)",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 animate-spin"
              style={{ borderColor: "#2d9cdb", borderTopColor: "transparent" }}
            />
            <span className="text-sm" style={{ color: "#2d9cdb" }}>Uploading…</span>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium" style={{ color: "#8899aa" }}>
              Drop PDFs here or <span style={{ color: "#2d9cdb" }}>click to browse</span>
            </p>
            <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>
              PDF only · Max 20 MB per file · Up to 20 files
            </p>
          </div>
        )}
      </div>

      {/* Error / success */}
      {error && (
        <p className="text-xs px-3 py-2 rounded" style={{ background: "rgba(224,82,82,0.08)", color: "#e05252", border: "1px solid rgba(224,82,82,0.2)" }}>
          {error}
        </p>
      )}
      {successMsg && (
        <p className="text-xs px-3 py-2 rounded" style={{ background: "rgba(46,204,113,0.08)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.2)" }}>
          {successMsg}
        </p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f) => (
            <div
              key={f.path}
              className="flex items-center justify-between rounded-lg px-3 py-2.5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span style={{ color: "#2d9cdb", fontSize: 14, flexShrink: 0 }}>PDF</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "#e8f4ff" }}>
                    {displayName(f.path, f.name)}
                  </p>
                  <p className="text-xs" style={{ color: "#3d4f60" }}>
                    {formatBytes(f.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(f.path)}
                className="text-xs px-2 py-1 rounded ml-3 shrink-0 transition-colors hover:bg-red-900/20"
                style={{ color: "#3d4f60" }}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}


      {/* Summarise button */}
      {files.length > 0 && (
        <button
          onClick={handleSummarise}
          disabled={summarising}
          className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ background: "rgba(45,156,219,0.15)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.3)" }}
        >
          {summarising ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 animate-spin inline-block" style={{ borderColor: "#2d9cdb", borderTopColor: "transparent" }} />
              Summarising {files.length} file{files.length !== 1 ? "s" : ""}…
            </span>
          ) : (
            `Summarise ${files.length} file${files.length !== 1 ? "s" : ""} for Assessment →`
          )}
        </button>
      )}

      {/* Research brief */}
      {(brief || files.length > 0) && (
        <div className="space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.25rem" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d9cdb" }}>
              Phase 1 Brief
              {briefDirty && <span style={{ color: "#e0a832", marginLeft: 6 }}>· unsaved</span>}
            </p>
            {brief && (
              <span className="text-xs" style={{ color: "#3d4f60" }}>
                {brief.length} chars
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: "#3d4f60", lineHeight: 1.5 }}>
            This brief is automatically injected into Claude when you generate the compliance snapshot in Phase 2.
          </p>
          <textarea
            value={brief}
            onChange={(e) => { setBrief(e.target.value); setBriefDirty(true); }}
            rows={14}
            placeholder="Click 'Summarise files for Assessment' above to generate a brief, or type notes here manually."
            className="w-full rounded-lg text-xs font-mono resize-y"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(45,156,219,0.15)",
              color: "#e8f4ff",
              padding: "10px 12px",
              lineHeight: 1.65,
              outline: "none",
            }}
          />
          <button
            onClick={handleSaveBrief}
            disabled={saving || !briefDirty}
            className="w-full rounded-lg py-2 text-xs font-semibold transition-opacity disabled:opacity-40"
            style={{ background: "rgba(200,168,75,0.12)", color: "#c8a84b", border: "1px solid rgba(200,168,75,0.25)" }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
