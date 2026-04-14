"use client";

import { useState } from "react";

type InsightVersion = {
  v:            number;
  content:      string;
  generated_at: string;
};

type Snapshot = {
  versions:          InsightVersion[];
  approved_pdf_path?: string;
};

type StructuredReport = {
  grade:              string;
  risk_classification: string;
  obligations: { status: string }[];
};

type Props = {
  demoId:        string;
  companyName:   string;
  contactEmail:  string;
  contactName?:  string;
  snapshot:      Snapshot | null;
};

function buildDefaultBody({
  companyName,
  contactName,
  grade,
  riskClassification,
  criticalCount,
  reportRef,
}: {
  companyName:        string;
  contactName:        string;
  grade:              string;
  riskClassification: string;
  criticalCount:      number;
  reportRef:          string;
}): string {
  const greeting    = contactName ? `Hi ${contactName.trim().split(" ")[0]},` : "Hi,";
  const urgencyNote = criticalCount > 0
    ? `Our initial analysis flags ${criticalCount} area${criticalCount !== 1 ? "s" : ""} that will require action before the August 2026 deadline.`
    : "Your initial compliance posture is encouraging — the attached brief has the full picture.";
  const riskShort = riskClassification.split("—")[0]?.trim() ?? riskClassification;

  return `${greeting}

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

export default function SnapshotEmailPanel({
  demoId,
  companyName,
  contactEmail,
  contactName = "",
  snapshot,
}: Props) {
  const [open, setOpen] = useState(false);

  // Derive report data from snapshot
  const versions = snapshot?.versions ?? [];
  const latest   = versions[versions.length - 1];
  const pdfPath  = snapshot?.approved_pdf_path ?? null;

  let grade              = "—";
  let riskClassification = "";
  let criticalCount      = 0;
  let partialCount       = 0;
  let compliantCount     = 0;
  let reportRef          = "";

  if (latest) {
    reportRef = `LSR-${new Date(latest.generated_at).getFullYear()}-${demoId.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
    try {
      const parsed = JSON.parse(latest.content) as StructuredReport;
      grade              = parsed.grade ?? "—";
      riskClassification = parsed.risk_classification ?? "";
      criticalCount      = parsed.obligations.filter(o => o.status === "critical_gap").length;
      partialCount       = parsed.obligations.filter(o => o.status === "partial").length;
      compliantCount     = parsed.obligations.filter(o => o.status === "compliant").length;
    } catch { /* use defaults */ }
  }

  const defaultSubject = `LexSutra Compliance Snapshot — ${companyName} [${reportRef}]`;
  const defaultBody    = latest ? buildDefaultBody({
    companyName, contactName, grade, riskClassification, criticalCount, reportRef,
  }) : "";

  const [subject,        setSubject]        = useState(defaultSubject);
  const [body,           setBody]           = useState(defaultBody);
  const [recipientEmail, setRecipientEmail] = useState(contactEmail);
  const [sending,        setSending]        = useState(false);
  const [sent,           setSent]           = useState(false);
  const [error,          setError]          = useState("");

  // Don't render if no analysis exists yet
  if (!latest) return null;

  const fileName = `${companyName.replace(/[^a-z0-9]/gi, "_")}_LexSutra_Snapshot_${reportRef}.pdf`;

  async function handleSend() {
    if (!recipientEmail || !subject || !body) return;
    if (!pdfPath) { setError("No approved PDF found. Generate and approve the snapshot first."); return; }
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/admin/quick-brief/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          contactEmail: recipientEmail,
          contactName,
          companyName,
          emailSubject: subject,
          emailBody:    body,
          storagePath:  pdfPath,
          fileName,
          deleteAfterSend: false, // keep snapshot PDF
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  const gradeColor =
    ["A+", "A"].includes(grade) ? "#15803d" :
    ["B+", "B"].includes(grade) ? "#2563eb" :
    ["C+", "C"].includes(grade) ? "#b7770a" :
    grade === "D" ? "#ea580c" : "#c0392b";

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(45,156,219,0.2)", background: "#0d1520" }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ borderBottom: open ? "1px solid rgba(45,156,219,0.12)" : "none" }}
      >
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "#2d9cdb" }}>
            Send Snapshot via Email
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>
            {pdfPath
              ? `Grade ${grade} · ${criticalCount} critical · ${partialCount} partial · ${compliantCount} compliant — PDF ready to send`
              : "Generate and approve the snapshot PDF first, then send here"}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {/* Grade badge */}
          {grade !== "—" && (
            <span
              style={{
                display:        "inline-flex",
                alignItems:     "center",
                justifyContent: "center",
                width:          32,
                height:         32,
                borderRadius:   6,
                border:         `1.5px solid ${gradeColor}`,
                background:     `${gradeColor}18`,
                fontSize:       13,
                fontWeight:     800,
                color:          gradeColor,
                fontFamily:     "Georgia, serif",
              }}
            >
              {grade}
            </span>
          )}
          <svg
            width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ color: "#3d4f60", transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }}
          >
            <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Body */}
      {open && (
        <div style={{ padding: "0 0 0 0" }}>
          {!pdfPath && (
            <div
              className="mx-5 my-4 rounded-lg px-4 py-3 text-sm"
              style={{ background: "rgba(224,168,50,0.07)", border: "1px solid rgba(224,168,50,0.25)", color: "#e0a832" }}
            >
              No approved PDF yet. In the Analysis panel above, generate a snapshot and click "Approve &amp; Save PDF", then come back here.
            </div>
          )}

          {/* Email composer */}
          <div style={{ borderBottom: "1px solid rgba(45,156,219,0.1)" }}>
            {/* From */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.8rem" }}>
              <span style={{ color: "#3d4f60", width: 52, flexShrink: 0 }}>From</span>
              <span style={{ color: "#7899aa" }}>Kunal Chaudhari · kunal@lexsutra.com</span>
            </div>
            {/* To */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.8rem" }}>
              <span style={{ color: "#3d4f60", width: 52, flexShrink: 0 }}>To</span>
              <input
                type="email"
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                disabled={sending}
                style={{
                  flex:       1,
                  fontSize:   "0.8rem",
                  background: "transparent",
                  border:     "none",
                  outline:    "none",
                  color:      "#e8f4ff",
                  padding:    "0.25rem 0",
                }}
              />
              {contactName && (
                <span style={{ color: "#3d4f60", fontSize: "0.75rem" }}>{contactName}</span>
              )}
            </div>
            {/* Subject */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.8rem" }}>
              <span style={{ color: "#3d4f60", width: 52, flexShrink: 0 }}>Subject</span>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                disabled={sending}
                style={{
                  flex:       1,
                  fontSize:   "0.8rem",
                  fontWeight: 500,
                  background: "transparent",
                  border:     "none",
                  outline:    "none",
                  color:      "#e8f4ff",
                  padding:    "0.25rem 0",
                }}
              />
            </div>
            {/* Attachment */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 1.25rem", fontSize: "0.75rem" }}>
              <span style={{ color: "#3d4f60", width: 52, flexShrink: 0 }}>Attach</span>
              <span style={{ color: pdfPath ? "#2ecc71" : "#3d4f60" }}>
                {pdfPath ? `📎 ${fileName}` : "No PDF — generate snapshot first"}
              </span>
            </div>
          </div>

          {/* Body textarea */}
          <div style={{ padding: "0.875rem 1.25rem" }}>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              disabled={sending}
              rows={13}
              style={{
                width:      "100%",
                resize:     "vertical",
                background: "transparent",
                border:     "none",
                outline:    "none",
                fontSize:   "0.83rem",
                lineHeight: 1.75,
                color:      "#c8d8e8",
                fontFamily: "inherit",
                padding:    0,
              }}
            />
          </div>

          {/* Actions */}
          <div style={{
            borderTop:  "1px solid rgba(255,255,255,0.05)",
            padding:    "0.75rem 1.25rem",
            display:    "flex",
            alignItems: "center",
            gap:        "0.75rem",
          }}>
            {error && (
              <span style={{ color: "#e05252", fontSize: "0.8rem", flex: 1 }}>{error}</span>
            )}
            {sent && (
              <span style={{ color: "#2ecc71", fontSize: "0.8rem", flex: 1 }}>✓ Sent to {recipientEmail}</span>
            )}
            {!error && !sent && <span style={{ flex: 1 }} />}

            <button
              onClick={handleSend}
              disabled={sending || !pdfPath || !recipientEmail || !subject || !body}
              className="btn-primary"
              style={{ fontSize: "0.82rem" }}
            >
              {sending ? (
                <><span className="loading-spinner" style={{ marginRight: 6 }} />Sending…</>
              ) : sent ? "✓ Sent!" : (
                `Send with PDF → ${recipientEmail || "enter email"}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
