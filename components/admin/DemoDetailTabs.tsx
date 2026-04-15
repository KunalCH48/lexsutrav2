"use client";

import { useState } from "react";
import DemoActionPanel from "./DemoActionPanel";
import DemoResearchPanel from "./DemoResearchPanel";
import DemoAnalysisPanel from "./DemoAnalysisPanel";
import RiskBriefPanel from "./RiskBriefPanel";
import SnapshotEmailPanel from "./SnapshotEmailPanel";

// ── Prop types (mirror what the server page has) ──────────────────

type FootprintSources = {
  websiteQuality:    "good" | "partial" | "failed";
  newsCount:         number;
  linkedInFound:     boolean;
  linkedInJobsFound: boolean;
  crunchbaseFound:   boolean;
};

type InsightVersion = {
  v:                    number;
  content:              string;
  generated_at:         string;
  internal_feedback:    string | null;
  website_scan_quality?: string;
};

type Snapshot = {
  versions:          InsightVersion[];
  approved_pdf_path?: string;
  footprint_cache?: {
    content:    string;
    sources:    FootprintSources;
    quality:    "good" | "partial" | "failed";
    fetched_at: string;
  };
};

export type DemoDetailTabsProps = {
  demoId:          string;
  companyName:     string;
  contactName:     string;
  contactEmail:    string;
  websiteUrl:      string | null;
  status:          string;
  scanQuality:     "good" | "partial" | "failed" | null;
  createdAt:       string;
  snapshot:        Snapshot | null;
  researchFiles:   { path: string; name: string; size: number }[];
  researchBrief:   string | null;
  existingCompany: { id: string; name: string } | null;
};

const TABS = ["Details", "Research", "Analysis", "Outreach"] as const;
type Tab = typeof TABS[number];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Field({ label, value, link, mono }: { label: string; value: string | null; link?: boolean; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#3d4f60" }}>{label}</p>
      {value ? (
        link ? (
          <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="gold-link text-sm break-all">{value}</a>
        ) : (
          <p className="text-sm break-all" style={{ color: "#e8f4ff", fontFamily: mono ? "monospace" : undefined }}>{value}</p>
        )
      ) : (
        <p className="text-sm" style={{ color: "#3d4f60" }}>—</p>
      )}
    </div>
  );
}

export default function DemoDetailTabs({
  demoId, companyName, contactName, contactEmail, websiteUrl,
  status, scanQuality, createdAt, snapshot, researchFiles,
  researchBrief, existingCompany,
}: DemoDetailTabsProps) {
  const [active, setActive] = useState<Tab>("Details");

  return (
    <div>
      {/* ── Tab bar ────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(45,156,219,0.1)", paddingBottom: "0" }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            style={{
              padding:        "0.5rem 1.1rem",
              fontSize:       "0.82rem",
              fontWeight:     active === tab ? 600 : 400,
              color:          active === tab ? "#e8f4ff" : "#3d4f60",
              background:     "transparent",
              border:         "none",
              borderBottom:   active === tab ? "2px solid #2d9cdb" : "2px solid transparent",
              cursor:         "pointer",
              marginBottom:   -1,
              transition:     "all 0.15s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Details tab ─────────────────────────────────────────── */}
      {active === "Details" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* LEFT — contact info */}
          <div className="rounded-xl p-6 space-y-6" style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}>
            <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d9cdb" }}>
              {status === "manual" ? "Prospect Details" : "Request Details"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Company Name"    value={companyName} />
              {contactName && <Field label="Contact Name"  value={contactName} />}
              <Field label="Business Email"  value={contactEmail} mono />
              <Field label="Website"         value={websiteUrl} link />
              <Field label="Submitted"       value={fmtDate(createdAt)} />
            </div>

            {/* Scan quality warnings */}
            {scanQuality === "failed" && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(224,82,82,0.08)", border: "1px solid rgba(224,82,82,0.3)", color: "#e05252" }}>
                <p className="font-semibold mb-0.5">⚠ Website could not be scanned</p>
                <p className="text-xs" style={{ color: "#c07070", lineHeight: 1.6 }}>
                  The public website was inaccessible. Any analysis generated is based solely on the absence of public information.
                </p>
              </div>
            )}
            {scanQuality === "partial" && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(224,168,50,0.07)", border: "1px solid rgba(224,168,50,0.25)", color: "#e0a832" }}>
                <p className="font-semibold mb-0.5">⚡ Partial scan — meta tags only</p>
                <p className="text-xs" style={{ color: "#a08020", lineHeight: 1.6 }}>
                  Only limited content was extracted. Analysis confidence will be lower.
                </p>
              </div>
            )}
            {existingCompany && status !== "converted" && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(224,82,82,0.08)", border: "1px solid rgba(224,82,82,0.2)", color: "#e05252" }}>
                ⚠ A company with this email already exists: <strong>{existingCompany.name}</strong>.
              </div>
            )}

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.25rem" }}>
              <Field label="Submission ID" value={demoId} mono />
            </div>
          </div>

          {/* RIGHT — action panel */}
          <DemoActionPanel demoId={demoId} status={status} companyName={companyName} email={contactEmail} />
        </div>
      )}

      {/* ── Research tab ────────────────────────────────────────── */}
      {active === "Research" && (
        <DemoResearchPanel
          demoId={demoId}
          initialFiles={researchFiles}
          initialBrief={researchBrief}
          footprintSources={snapshot?.footprint_cache?.sources ?? null}
        />
      )}

      {/* ── Analysis tab ────────────────────────────────────────── */}
      {active === "Analysis" && (
        <div className="space-y-6">
          <DemoAnalysisPanel
            demoId={demoId}
            companyName={companyName}
            contactEmail={contactEmail}
            scanQuality={scanQuality}
            initialSnapshot={snapshot}
          />
          <RiskBriefPanel
            demoId={demoId}
            companyName={companyName}
            snapshot={snapshot}
          />
        </div>
      )}

      {/* ── Outreach tab ─────────────────────────────────────────── */}
      {active === "Outreach" && (
        <SnapshotEmailPanel
          demoId={demoId}
          companyName={companyName}
          contactEmail={contactEmail}
          contactName={contactName}
          websiteUrl={websiteUrl}
        />
      )}
    </div>
  );
}
