"use client";

import { useState } from "react";

type BriefData = {
  grade:              string;
  criticalCount:      number;
  partialCount:       number;
  compliantCount:     number;
  reportRef:          string;
  storagePath:        string;
  fileName:           string;
  previewUrl:         string | null;
  emailSubject:       string;
  emailBodyText:      string;
};

// What gets saved in insights_snapshot.brief_data (no email text — regenerated fresh)
type SavedBrief = {
  storagePath:   string;
  fileName:      string;
  grade:         string;
  reportRef:     string;
  criticalCount: number;
  partialCount:  number;
  compliantCount:number;
};

type Props = {
  demoId:       string;
  companyName:  string;
  contactEmail: string;
  contactName?: string;
  websiteUrl:   string | null;
  savedBrief:   SavedBrief | null;
};

function buildDefaultEmailContent(companyName: string, contactName: string, grade: string, criticalCount: number, reportRef: string) {
  const goodGrades  = ["A+", "A", "B+", "B"];
  const urgencyNote = criticalCount > 0
    ? `Our initial analysis flags ${criticalCount} critical area${criticalCount !== 1 ? "s" : ""} that will require action before the August 2026 deadline.`
    : goodGrades.includes(grade)
      ? "Your initial compliance posture is encouraging — the attached brief has the full picture."
      : "The attached brief outlines the specific gaps and the steps needed to address them before the August 2026 deadline.";

  const greeting = contactName ? `Hi ${contactName.trim().split(" ")[0]},` : "Hi,";

  return {
    subject: `LexSutra Compliance Brief — ${companyName} [${reportRef}]`,
    body: `${greeting}

I've completed a preliminary EU AI Act compliance snapshot for ${companyName} and wanted to share it directly.

Based on publicly available information, ${companyName} receives an initial compliance grade of ${grade}. ${urgencyNote}

The full compliance brief is attached to this email (ref: ${reportRef}). It covers all eight mandatory obligations of the EU AI Act and outlines the specific steps needed to reach compliance.

This is a public-footprint snapshot — a starting point before a full diagnostic engagement. If the findings are useful, I'd be happy to walk through them on a brief call and discuss what a full diagnostic would look like for your team.

The August 2026 deadline is closer than most companies realise.

Kind regards,
Kunal Chaudhari
LexSutra — AI Compliance Diagnostic Infrastructure
kunal@lexsutra.com · lexsutra.com · Netherlands`,
  };
}

export default function SnapshotEmailPanel({
  demoId,
  companyName,
  contactEmail,
  contactName = "",
  websiteUrl,
  savedBrief,
}: Props) {
  // Initialise directly from savedBrief if it exists
  const initBrief: BriefData | null = savedBrief ? (() => {
    const { subject, body } = buildDefaultEmailContent(companyName, contactName, savedBrief.grade, savedBrief.criticalCount, savedBrief.reportRef);
    return { ...savedBrief, previewUrl: null, emailSubject: subject, emailBodyText: body };
  })() : null;

  const [brief,      setBrief]      = useState<BriefData | null>(initBrief);
  const [generating, setGenerating] = useState(false);
  const [genError,   setGenError]   = useState("");

  const [subject,    setSubject]    = useState(initBrief?.emailSubject ?? "");
  const [body,       setBody]       = useState(initBrief?.emailBodyText ?? "");
  const [toEmail,    setToEmail]    = useState(contactEmail);
  const [sending,    setSending]    = useState(false);
  const [sent,       setSent]       = useState(false);
  const [sendError,  setSendError]  = useState("");

  const gradeColor = brief ? (
    ["A+", "A"].includes(brief.grade) ? "#2ecc71" :
    ["B+", "B"].includes(brief.grade) ? "#2d9cdb" :
    ["C+", "C"].includes(brief.grade) ? "#e0a832" :
    "#e05252"
  ) : "#3d4f60";

  async function handleGenerate() {
    setGenerating(true);
    setGenError("");

    try {
      const res = await fetch("/api/admin/quick-brief", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ companyName, websiteUrl, demoId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setBrief(data);
      setSubject(data.emailSubject);
      setBody(data.emailBodyText);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    if (!brief) return;
    setSending(true);
    setSendError("");

    try {
      const res = await fetch("/api/admin/quick-brief/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          contactEmail:    toEmail,
          contactName,
          companyName,
          emailSubject:    subject,
          emailBody:       body,
          storagePath:     brief.storagePath,
          fileName:        brief.fileName,
          deleteAfterSend: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setSent(true);
      setTimeout(() => setSent(false), 6000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(45,156,219,0.2)", background: "#0d1520" }}>

      {/* ── Header ── */}
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(45,156,219,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "#2d9cdb" }}>Send Compliance Brief</h3>
          <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>
            {brief
              ? savedBrief && !generating
                ? `Brief saved · Grade ${brief.grade} · ${brief.criticalCount} critical · ${brief.partialCount} partial · ${brief.compliantCount} compliant`
                : `Grade ${brief.grade} · ${brief.criticalCount} critical · ${brief.partialCount} partial · ${brief.compliantCount} compliant`
              : "Generate a compliance brief, then send it with PDF attached"}
          </p>
        </div>
        {brief && (
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 6,
            border: `1.5px solid ${gradeColor}`, background: `${gradeColor}20`,
            fontSize: 13, fontWeight: 800, color: gradeColor, fontFamily: "Georgia, serif",
          }}>
            {brief.grade}
          </span>
        )}
      </div>

      {/* ── Generate step (only if no brief yet) ── */}
      {!brief && (
        <div style={{ padding: "1.25rem" }}>
          {!websiteUrl && (
            <p className="text-xs mb-3" style={{ color: "#e0a832" }}>
              ⚠ No website URL on this prospect — brief will be generated without website content.
            </p>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary"
            style={{ fontSize: "0.82rem" }}
          >
            {generating
              ? <><span className="loading-spinner" style={{ marginRight: 6 }} />Analysing {companyName}…</>
              : "Generate Brief →"}
          </button>
          {genError && (
            <p style={{ color: "#e05252", fontSize: "0.8rem", marginTop: "0.75rem" }}>{genError}</p>
          )}
        </div>
      )}

      {/* ── Email composer (once brief exists) ── */}
      {brief && (
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
              <input
                type="email" value={toEmail} onChange={e => setToEmail(e.target.value)} disabled={sending}
                style={{ flex: 1, fontSize: "0.8rem", background: "transparent", border: "none", outline: "none", color: "#e8f4ff", padding: "0.25rem 0" }}
              />
              {contactName && <span style={{ color: "#3d4f60", fontSize: "0.75rem" }}>{contactName}</span>}
            </div>
            {/* Subject */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.8rem" }}>
              <span style={{ color: "#3d4f60", width: 56, flexShrink: 0 }}>Subject</span>
              <input
                type="text" value={subject} onChange={e => setSubject(e.target.value)} disabled={sending}
                style={{ flex: 1, fontSize: "0.8rem", fontWeight: 500, background: "transparent", border: "none", outline: "none", color: "#e8f4ff", padding: "0.25rem 0" }}
              />
            </div>
            {/* Attachment */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.35rem 1.25rem", fontSize: "0.75rem" }}>
              <span style={{ color: "#3d4f60", width: 56, flexShrink: 0 }}>Attach</span>
              <span style={{ color: "#2ecc71" }}>📎 {brief.fileName}</span>
              {brief.previewUrl && (
                <a href={brief.previewUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color: "#2d9cdb", textDecoration: "underline", fontSize: "0.72rem" }}>
                  Preview PDF ↗
                </a>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "0.875rem 1.25rem" }}>
            <textarea
              value={body} onChange={e => setBody(e.target.value)} disabled={sending} rows={13}
              style={{ width: "100%", resize: "vertical", background: "transparent", border: "none", outline: "none", fontSize: "0.83rem", lineHeight: 1.75, color: "#c8d8e8", fontFamily: "inherit", padding: 0 }}
            />
          </div>

          {/* Actions */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={() => { setBrief(null); setSubject(""); setBody(""); setGenError(""); setSendError(""); setSent(false); }}
              disabled={sending}
              className="btn-ghost"
              style={{ fontSize: "0.78rem" }}
            >
              ↺ Regenerate
            </button>

            <span style={{ flex: 1 }}>
              {sendError && <span style={{ color: "#e05252", fontSize: "0.8rem" }}>{sendError}</span>}
              {sent && <span style={{ color: "#2ecc71", fontSize: "0.8rem" }}>✓ Sent to {toEmail}</span>}
            </span>

            <button
              onClick={handleSend}
              disabled={sending || !toEmail || !subject || !body}
              className="btn-primary"
              style={{ fontSize: "0.82rem" }}
            >
              {sending
                ? <><span className="loading-spinner" style={{ marginRight: 6 }} />Sending…</>
                : sent ? "✓ Sent!" : `Send Brief → ${toEmail || "enter email"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
