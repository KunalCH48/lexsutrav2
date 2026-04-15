"use client";

import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────

type ObligationItem = {
  number:          string;
  name:            string;
  article:         string;
  status:          string;
  finding:         string;
  required_action: string;
  effort:          string;
  deadline:        string;
};

type StructuredReport = {
  grade:           string;
  risk_classification: string;
  obligations:     ObligationItem[];
};

export type SavedBrief = {
  report:        StructuredReport;
  reportRef:     string;
  assessmentDate:string;
  generatedAt:   string;
  teaser?: {
    obligationIndex: number;
    storagePath:     string;
    fileName:        string;
  };
};

type TeaserData = {
  storagePath:     string;
  fileName:        string;
  previewUrl:      string | null;
  obligationIndex: number;
};

type Props = {
  demoId:       string;
  companyName:  string;
  contactEmail: string;
  contactName?: string;
  websiteUrl:   string | null;
  savedBrief:   SavedBrief | null;
};

// ── Status helpers ─────────────────────────────────────────────────

function statusColor(s: string) {
  if (s === "critical_gap") return "#c0392b";
  if (s === "not_started")  return "#c05500";
  if (s === "partial")      return "#b7770a";
  if (s === "compliant")    return "#15803d";
  return "#3d4f60";
}
function statusBg(s: string) {
  if (s === "critical_gap") return "rgba(192,57,43,0.08)";
  if (s === "not_started")  return "rgba(192,85,0,0.08)";
  if (s === "partial")      return "rgba(183,119,10,0.08)";
  if (s === "compliant")    return "rgba(21,128,61,0.08)";
  return "rgba(255,255,255,0.03)";
}
function statusLabel(s: string) {
  if (s === "critical_gap") return "Critical Gap";
  if (s === "not_started")  return "No Evidence";
  if (s === "partial")      return "Partial";
  if (s === "compliant")    return "Compliant";
  return s;
}

// ── Email body builder ─────────────────────────────────────────────

function buildEmailBody(
  companyName:       string,
  contactName:       string,
  obligation:        ObligationItem,
  grade:             string,
  riskClassification:string,
): string {
  const firstName = contactName?.trim().split(" ")[0] ?? "";
  const greeting  = firstName ? `Hi ${firstName},` : "Hi,";

  // One concrete gap — first full sentence of finding
  const findingSnippet = obligation.finding.split(".")[0]?.trim() ?? obligation.finding;
  const gap = findingSnippet.length > 140 ? findingSnippet.slice(0, 137) + "…" : findingSnippet;

  // Softened risk classification — first clause only
  const riskShort = riskClassification.split("—")[0]?.split(",")[0]?.trim() ?? "likely High-Risk";

  return `${greeting}

I took a quick look at ${companyName} from an EU AI Act perspective and put together a short compliance snapshot based on publicly available information.

From what's visible, the system appears likely to fall within the ${riskShort} category (depending on how it's used), which brings specific obligations ahead of the August 2026 deadline.

The indicative posture comes out at ${grade}, based on publicly available evidence. For example, ${obligation.name} — ${gap}.

I've attached a short brief showing this in more detail.

Curious if this roughly aligns with your internal view — happy to walk through it if useful.

Best,
Kunal
LexSutra`;
}

// ── Component ──────────────────────────────────────────────────────

export default function SnapshotEmailPanel({
  demoId, companyName, contactEmail, contactName = "", websiteUrl, savedBrief,
}: Props) {

  // Step 1: analysis — Step 2: pick obligation — Step 3: compose & send
  type Step = "analyse" | "pick" | "compose";

  const initStep: Step = savedBrief?.report
    ? savedBrief.teaser ? "compose" : "pick"
    : "analyse";

  const [step,       setStep]       = useState<Step>(initStep);
  const [report,     setReport]     = useState<StructuredReport | null>(savedBrief?.report ?? null);
  const [reportRef,  setReportRef]  = useState(savedBrief?.reportRef ?? "");
  const [assDate,    setAssDate]    = useState(savedBrief?.assessmentDate ?? "");
  const [analysing,  setAnalysing]  = useState(false);
  const [analyseErr, setAnalyseErr] = useState("");

  const initTeaser: TeaserData | null = savedBrief?.teaser
    ? { ...savedBrief.teaser, previewUrl: null }
    : null;
  const [selected,   setSelected]   = useState<number | null>(savedBrief?.teaser?.obligationIndex ?? null);
  const [teaser,     setTeaser]     = useState<TeaserData | null>(initTeaser);
  const [generating, setGenerating] = useState(false);
  const [genErr,     setGenErr]     = useState("");

  const selectedOb = report && selected !== null ? report.obligations[selected] : null;
  const [subject,   setSubject]     = useState(
    teaser && selectedOb ? `${companyName} — EU AI Act snapshot (brief attached)` : ""
  );
  const [body,      setBody]        = useState(
    teaser && selectedOb
      ? buildEmailBody(companyName, contactName, selectedOb, savedBrief?.report.grade ?? "", savedBrief?.report.risk_classification ?? "")
      : ""
  );
  const [toEmail,   setToEmail]     = useState(contactEmail);
  const [sending,   setSending]     = useState(false);
  const [sent,      setSent]        = useState(false);
  const [sendErr,   setSendErr]     = useState("");

  const gradeColor = report
    ? ["A+","A"].includes(report.grade) ? "#2ecc71"
    : ["B+","B"].includes(report.grade) ? "#2d9cdb"
    : ["C+","C"].includes(report.grade) ? "#e0a832"
    : "#e05252"
    : "#3d4f60";

  // ── Handlers ────────────────────────────────────────────────────

  async function handleAnalyse() {
    setAnalysing(true);
    setAnalyseErr("");
    try {
      const res  = await fetch("/api/admin/quick-brief", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, websiteUrl, demoId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setReport(data.report);
      setReportRef(data.reportRef);
      setAssDate(data.assessmentDate);
      setStep("pick");
    } catch (err) {
      setAnalyseErr(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalysing(false);
    }
  }

  async function handleGenerateTeaser() {
    if (selected === null) return;
    setGenerating(true);
    setGenErr("");
    try {
      const res  = await fetch("/api/admin/quick-brief/teaser", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId, obligationIndex: selected, companyName, reportRef, assessmentDate: assDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setTeaser({ storagePath: data.storagePath, fileName: data.fileName, previewUrl: data.previewUrl, obligationIndex: selected });
      const ob = report!.obligations[selected];
      setSubject(`${companyName} — EU AI Act snapshot (brief attached)`);
      setBody(buildEmailBody(companyName, contactName, ob, report!.grade, report!.risk_classification));
      setStep("compose");
    } catch (err) {
      setGenErr(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    if (!teaser) return;
    setSending(true);
    setSendErr("");
    try {
      const res  = await fetch("/api/admin/quick-brief/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactEmail: toEmail, contactName, companyName,
          emailSubject: subject, emailBody: body,
          storagePath:  teaser.storagePath,
          fileName:     teaser.fileName,
          deleteAfterSend: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setSent(true);
      setTimeout(() => setSent(false), 6000);
    } catch (err) {
      setSendErr(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(45,156,219,0.2)", background: "#0d1520" }}>

      {/* Header */}
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(45,156,219,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "#2d9cdb" }}>Send Compliance Brief</h3>
          <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>
            {step === "analyse" && "Step 1 of 3 — Run analysis to see obligation gaps"}
            {step === "pick"    && `Step 2 of 3 — Pick one obligation to feature in the teaser · Grade ${report?.grade}`}
            {step === "compose" && `Step 3 of 3 — Edit and send · ${selectedOb?.name}`}
          </p>
        </div>
        {report && (
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, border: `1.5px solid ${gradeColor}`, background: `${gradeColor}20`, fontSize: 13, fontWeight: 800, color: gradeColor, fontFamily: "Georgia, serif" }}>
            {report.grade}
          </span>
        )}
      </div>

      {/* ── Step 1: Analyse ── */}
      {step === "analyse" && (
        <div style={{ padding: "1.25rem" }}>
          {!websiteUrl && (
            <p className="text-xs mb-3" style={{ color: "#e0a832" }}>
              ⚠ No website URL — analysis will run without website content.
            </p>
          )}
          <button onClick={handleAnalyse} disabled={analysing} className="btn-primary" style={{ fontSize: "0.82rem" }}>
            {analysing
              ? <><span className="loading-spinner" style={{ marginRight: 6 }} />Analysing {companyName}…</>
              : "Run Analysis →"}
          </button>
          {analyseErr && <p style={{ color: "#e05252", fontSize: "0.8rem", marginTop: "0.75rem" }}>{analyseErr}</p>}
        </div>
      )}

      {/* ── Step 2: Pick obligation ── */}
      {step === "pick" && report && (
        <div style={{ padding: "1.25rem" }}>
          <p className="text-xs mb-3" style={{ color: "#3d4f60" }}>
            Select the most compelling gap to feature in the teaser brief. The recipient will only see this one obligation.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
            {report.obligations.map((ob, i) => {
              const color  = statusColor(ob.status);
              const bg     = statusBg(ob.status);
              const isSelected = selected === i;
              return (
                <button
                  key={ob.number}
                  onClick={() => setSelected(i)}
                  style={{
                    padding: "0.65rem 0.875rem", borderRadius: 8, textAlign: "left", cursor: "pointer",
                    border: isSelected ? `1.5px solid ${color}` : "1px solid rgba(45,156,219,0.12)",
                    background: isSelected ? bg : "rgba(255,255,255,0.02)",
                    transition: "all 0.12s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#e8f4ff" }}>{ob.number}. {ob.name}</span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color, background: `${color}18`, padding: "1px 6px", borderRadius: 4, flexShrink: 0, marginLeft: 4 }}>
                      {statusLabel(ob.status)}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.72rem", color: "#3d4f60", margin: 0, lineHeight: 1.4 }}>
                    {ob.finding.slice(0, 80)}{ob.finding.length > 80 ? "…" : ""}
                  </p>
                </button>
              );
            })}
          </div>

          {genErr && <p style={{ color: "#e05252", fontSize: "0.8rem", marginBottom: "0.75rem" }}>{genErr}</p>}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handleGenerateTeaser}
              disabled={selected === null || generating}
              className="btn-primary"
              style={{ fontSize: "0.82rem" }}
            >
              {generating
                ? <><span className="loading-spinner" style={{ marginRight: 6 }} />Generating teaser…</>
                : "Generate Teaser Brief →"}
            </button>
            <button onClick={() => { setStep("analyse"); setReport(null); setSelected(null); }} className="btn-ghost" style={{ fontSize: "0.78rem" }}>
              ← Re-analyse
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Compose & send ── */}
      {step === "compose" && teaser && (
        <div>
          <div style={{ borderBottom: "1px solid rgba(45,156,219,0.1)" }}>
            {/* From */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.55rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.8rem" }}>
              <span style={{ color: "#3d4f60", width: 56, flexShrink: 0 }}>From</span>
              <span style={{ color: "#7899aa" }}>Kunal Chaudhari · kunal@lexsutra.com</span>
            </div>
            {/* To */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.8rem" }}>
              <span style={{ color: "#3d4f60", width: 56, flexShrink: 0 }}>To</span>
              <input type="email" value={toEmail} onChange={e => setToEmail(e.target.value)} disabled={sending}
                style={{ flex: 1, fontSize: "0.8rem", background: "transparent", border: "none", outline: "none", color: "#e8f4ff", padding: "0.25rem 0" }} />
              {contactName && <span style={{ color: "#3d4f60", fontSize: "0.75rem" }}>{contactName}</span>}
            </div>
            {/* Subject */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.8rem" }}>
              <span style={{ color: "#3d4f60", width: 56, flexShrink: 0 }}>Subject</span>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} disabled={sending}
                style={{ flex: 1, fontSize: "0.8rem", fontWeight: 500, background: "transparent", border: "none", outline: "none", color: "#e8f4ff", padding: "0.25rem 0" }} />
            </div>
            {/* Attachment */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.35rem 1.25rem", fontSize: "0.75rem" }}>
              <span style={{ color: "#3d4f60", width: 56, flexShrink: 0 }}>Attach</span>
              <span style={{ color: "#2ecc71" }}>📎 {teaser.fileName}</span>
              {teaser.previewUrl && (
                <a href={teaser.previewUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color: "#2d9cdb", textDecoration: "underline", fontSize: "0.72rem" }}>
                  Preview ↗
                </a>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "0.875rem 1.25rem" }}>
            <textarea value={body} onChange={e => setBody(e.target.value)} disabled={sending} rows={11}
              style={{ width: "100%", resize: "vertical", background: "transparent", border: "none", outline: "none", fontSize: "0.83rem", lineHeight: 1.75, color: "#c8d8e8", fontFamily: "inherit", padding: 0 }}
            />
          </div>

          {/* Actions */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button onClick={() => { setStep("pick"); setTeaser(null); }} disabled={sending} className="btn-ghost" style={{ fontSize: "0.78rem" }}>
              ← Change obligation
            </button>
            <span style={{ flex: 1 }}>
              {sendErr && <span style={{ color: "#e05252", fontSize: "0.8rem" }}>{sendErr}</span>}
              {sent    && <span style={{ color: "#2ecc71", fontSize: "0.8rem" }}>✓ Sent to {toEmail}</span>}
            </span>
            <button onClick={handleSend} disabled={sending || !toEmail || !subject || !body} className="btn-primary" style={{ fontSize: "0.82rem" }}>
              {sending ? <><span className="loading-spinner" style={{ marginRight: 6 }} />Sending…</> : sent ? "✓ Sent!" : `Send Brief →`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
