"use client";

import { useState } from "react";

type GenerateResult = {
  grade:              string;
  riskClassification: string;
  criticalCount:      number;
  partialCount:       number;
  compliantCount:     number;
  reportRef:          string;
  assessmentDate:     string;
  storagePath:        string;
  fileName:           string;
  emailSubject:       string;
  emailBodyText:      string;
};

const GRADE_COLOR: Record<string, string> = {
  "A+": "#15803d", A: "#16a34a",
  "B+": "#2563eb", B: "#3b82f6",
  "C+": "#b7770a", C: "#ca8a04",
  D:   "#ea580c",
  F:   "#c0392b",
};

function GradeBadge({ grade }: { grade: string }) {
  const color = GRADE_COLOR[grade] ?? "#6b7280";
  return (
    <div style={{
      display:        "inline-flex",
      alignItems:     "center",
      justifyContent: "center",
      width:          56,
      height:         56,
      borderRadius:   8,
      border:         `2px solid ${color}`,
      background:     `${color}18`,
      fontSize:       22,
      fontWeight:     800,
      color,
      fontFamily:     "Georgia, serif",
      flexShrink:     0,
    }}>
      {grade}
    </div>
  );
}

export default function QuickSendPage() {
  // Form fields
  const [companyName,   setCompanyName]   = useState("");
  const [websiteUrl,    setWebsiteUrl]    = useState("");
  const [contactName,   setContactName]   = useState("");
  const [contactEmail,  setContactEmail]  = useState("");

  // State machine: idle → generating → preview → sending → sent
  const [step,        setStep]        = useState<"idle" | "generating" | "preview" | "sending" | "sent">("idle");
  const [result,      setResult]      = useState<GenerateResult | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody,    setEmailBody]    = useState("");
  const [error,       setError]       = useState("");

  async function handleGenerate() {
    if (!companyName.trim()) { setError("Company name is required."); return; }
    setStep("generating");
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/quick-brief", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ companyName: companyName.trim(), websiteUrl: websiteUrl.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setResult(data as GenerateResult);
      // Personalise greeting if we have a contact name
      const personalised = contactName.trim()
        ? (data.emailBodyText as string).replace(/^Hi,/, `Hi ${contactName.trim().split(" ")[0]},`)
        : data.emailBodyText;
      setEmailSubject(data.emailSubject);
      setEmailBody(personalised);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setStep("idle");
    }
  }

  async function handleSend() {
    if (!contactEmail.trim()) { setError("Contact email is required to send."); return; }
    if (!result) return;
    setStep("sending");
    setError("");

    try {
      const res = await fetch("/api/admin/quick-brief/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          contactEmail: contactEmail.trim(),
          contactName:  contactName.trim(),
          companyName:  companyName.trim(),
          emailSubject,
          emailBody,
          storagePath:  result.storagePath,
          fileName:     result.fileName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setStep("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
      setStep("preview");
    }
  }

  function handleReset() {
    setStep("idle");
    setResult(null);
    setEmailSubject("");
    setEmailBody("");
    setError("");
    setCompanyName("");
    setWebsiteUrl("");
    setContactName("");
    setContactEmail("");
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-bright)", margin: 0 }}>
          Quick Send Brief
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>
          Generate a compliance brief and send it directly to a prospect with the PDF attached.
        </p>
      </div>

      {/* ── STEP: IDLE / FORM ─────────────────────────────────────── */}
      {(step === "idle" || step === "generating") && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Company Name *</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Carv"
                disabled={step === "generating"}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Website URL</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                placeholder="https://carv.com"
                disabled={step === "generating"}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Contact Name</label>
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                placeholder="e.g. Barend Raaff"
                disabled={step === "generating"}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="barend@carv.com"
                disabled={step === "generating"}
              />
            </div>
          </div>

          {error && (
            <p style={{ color: "var(--red)", fontSize: "0.85rem", marginTop: "1rem", marginBottom: 0 }}>
              {error}
            </p>
          )}

          <div style={{ marginTop: "1.25rem" }}>
            <button
              onClick={handleGenerate}
              disabled={step === "generating" || !companyName.trim()}
              className="btn-primary"
            >
              {step === "generating" ? (
                <>
                  <span className="loading-spinner" style={{ marginRight: 6 }} />
                  Scanning website + running AI analysis + generating PDF…
                </>
              ) : "Generate Brief"}
            </button>
            {step === "generating" && (
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.5rem", marginBottom: 0 }}>
                This takes 30–60 seconds. Website scan → evidence extraction → full EU AI Act analysis → PDF generation.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── STEP: PREVIEW ─────────────────────────────────────────── */}
      {(step === "preview" || step === "sending") && result && (
        <>
          {/* Result summary */}
          <div className="card" style={{ padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <GradeBadge grade={result.grade} />
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 2 }}>
                  Compliance Grade · {result.reportRef} · {result.assessmentDate}
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-bright)", marginBottom: 4 }}>
                  {result.riskClassification.split("—")[0]?.trim() ?? result.riskClassification}
                </div>
                <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8rem" }}>
                  {result.criticalCount > 0 && (
                    <span style={{ color: "#e05252" }}>
                      {result.criticalCount} critical gap{result.criticalCount !== 1 ? "s" : ""}
                    </span>
                  )}
                  {result.partialCount > 0 && (
                    <span style={{ color: "#e0a832" }}>
                      {result.partialCount} partial
                    </span>
                  )}
                  {result.compliantCount > 0 && (
                    <span style={{ color: "#2ecc71" }}>
                      {result.compliantCount} compliant
                    </span>
                  )}
                </div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                <div>PDF generated</div>
                <div style={{ color: "#2ecc71" }}>Ready to send</div>
              </div>
            </div>
          </div>

          {/* Email draft */}
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "1rem" }}>
            {/* Email header */}
            <div style={{
              background:   "var(--bg-elevated)",
              borderBottom: "1px solid var(--border)",
              padding:      "0.875rem 1rem",
              display:      "flex",
              flexDirection: "column",
              gap:          "0.5rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
                <span style={{ color: "var(--text-muted)", width: 52, flexShrink: 0 }}>From</span>
                <span style={{ color: "var(--text-bright)" }}>Kunal Chaudhari · kunal@lexsutra.com</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
                <span style={{ color: "var(--text-muted)", width: 52, flexShrink: 0 }}>To</span>
                <span style={{ color: "var(--text-bright)" }}>
                  {contactName && <span style={{ marginRight: 4 }}>{contactName} ·</span>}
                  {contactEmail || <span style={{ color: "var(--text-muted)" }}>— (enter email below before sending)</span>}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "var(--text-muted)", width: 52, flexShrink: 0, fontSize: "0.8rem" }}>Subject</span>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  disabled={step === "sending"}
                  style={{
                    flex:       1,
                    fontSize:   "0.85rem",
                    fontWeight: 500,
                    background: "transparent",
                    border:     "none",
                    outline:    "none",
                    color:      "var(--text-bright)",
                    padding:    0,
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
                <span style={{ color: "var(--text-muted)", width: 52, flexShrink: 0 }}>Attach</span>
                <span style={{ color: "#2ecc71" }}>📎 {result.fileName}</span>
              </div>
            </div>

            {/* Email body */}
            <div style={{ padding: "1rem" }}>
              <textarea
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                disabled={step === "sending"}
                rows={14}
                style={{
                  width:      "100%",
                  resize:     "vertical",
                  background: "transparent",
                  border:     "none",
                  outline:    "none",
                  fontSize:   "0.875rem",
                  lineHeight: 1.7,
                  color:      "var(--text-bright)",
                  fontFamily: "inherit",
                  padding:    0,
                }}
              />
            </div>

            {/* Actions */}
            <div style={{
              borderTop: "1px solid var(--border)",
              padding:   "0.75rem 1rem",
              display:   "flex",
              gap:       "0.75rem",
              alignItems: "center",
              flexWrap:  "wrap",
            }}>
              <button
                onClick={() => setStep("idle")}
                disabled={step === "sending"}
                className="btn-ghost"
                style={{ fontSize: "0.8rem" }}
              >
                ← Regenerate
              </button>

              {/* Contact email input (if not already filled) */}
              {!contactEmail.trim() && (
                <input
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="Contact email (required to send)"
                  style={{ flex: 1, fontSize: "0.8rem" }}
                />
              )}

              {error && (
                <span style={{ color: "var(--red)", fontSize: "0.8rem" }}>{error}</span>
              )}

              <button
                onClick={handleSend}
                disabled={step === "sending" || !emailBody.trim() || !emailSubject.trim() || !contactEmail.trim()}
                className="btn-primary"
                style={{ fontSize: "0.85rem", marginLeft: "auto" }}
              >
                {step === "sending" ? (
                  <>
                    <span className="loading-spinner" style={{ marginRight: 6 }} />
                    Sending…
                  </>
                ) : `Send with PDF → ${contactEmail.trim() || "enter email"}`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── STEP: SENT ────────────────────────────────────────────── */}
      {step === "sent" && (
        <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✓</div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-bright)", margin: "0 0 0.5rem 0" }}>
            Brief sent to {contactEmail}
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: "0 0 1.5rem 0" }}>
            PDF attached · Logged to activity · {result?.reportRef}
          </p>
          <button onClick={handleReset} className="btn-primary">
            Send Another Brief
          </button>
        </div>
      )}
    </div>
  );
}
