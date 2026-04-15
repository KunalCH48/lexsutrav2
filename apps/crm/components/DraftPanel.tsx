"use client";

import { useState } from "react";

const MESSAGE_TYPES = [
  { value: "prospect_outreach", label: "Prospect Outreach" },
  { value: "prospect_followup", label: "Prospect Follow-up" },
  { value: "job_followup", label: "Job Follow-up" },
  { value: "cover_note", label: "Cover Note" },
];

const TONES = [
  { value: "warm", label: "Warm" },
  { value: "direct", label: "Direct" },
  { value: "formal", label: "Formal" },
];

interface Props {
  recordId?: string;
  recordType?: "prospect" | "job";
  defaultType?: string;
  contactEmail?: string;
  contactName?: string;
  onSaved?: (message: { id: string; label: string; content: string }) => void;
}

export default function DraftPanel({ recordId, recordType, defaultType = "prospect_outreach", contactEmail, contactName, onSaved }: Props) {
  const [context, setContext] = useState("");
  const [type, setType] = useState(defaultType);
  const [tone, setTone] = useState("direct");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState(false);
  const [savedLabel, setSavedLabel] = useState("");

  async function generateDraft() {
    if (!context.trim()) return;
    setLoading(true);
    setError("");
    setDraft("");
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, type, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setDraft(data.draft);
      setSubject(data.subject ?? "");
      setBody(data.body ?? data.draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function copyDraft() {
    const full = subject ? `Subject: ${subject}\n\n${body}` : body;
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveDraft() {
    if (!draft || !recordId || !recordType) return;
    setSaving(true);
    try {
      const label = savedLabel || `${MESSAGE_TYPES.find(t => t.value === type)?.label} (${tone})`;
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId, recordType, label, content: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved?.(data);
      setSavedLabel("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function sendEmail() {
    if (!body || !contactEmail) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: contactEmail, subject, body, recordId, recordType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Context paste area */}
      <div className="field">
        <label>Paste context (LinkedIn profile, company info, or job description)</label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={6}
          placeholder="Paste the LinkedIn profile, company about page, or job description here…"
          style={{ resize: "vertical" }}
        />
      </div>

      {/* Type + tone row */}
      <div style={{ display: "flex", gap: "1rem" }}>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>Message type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {MESSAGE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)}>
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={generateDraft}
        disabled={loading || !context.trim()}
        className="btn-primary"
        style={{ alignSelf: "flex-start" }}
      >
        {loading ? <span className="loading-spinner" /> : null}
        {loading ? "Drafting…" : draft ? "Regenerate" : "Generate Draft"}
      </button>

      {error && (
        <p style={{ color: "var(--red)", fontSize: "0.85rem" }}>{error}</p>
      )}

      {/* Email preview */}
      {draft && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Email header */}
          <div style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", padding: "0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
              <span style={{ color: "var(--text-muted)", width: 48, flexShrink: 0 }}>From</span>
              <span style={{ color: "var(--text-bright)" }}>Kunal Chaudhari · kunal@lexsutra.com</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
              <span style={{ color: "var(--text-muted)", width: 48, flexShrink: 0 }}>To</span>
              <span style={{ color: "var(--text-bright)" }}>
                {contactName && <span style={{ marginRight: 4 }}>{contactName} ·</span>}
                {contactEmail ?? <span style={{ color: "var(--text-muted)" }}>—</span>}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "var(--text-muted)", width: 48, flexShrink: 0, fontSize: "0.8rem" }}>Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="(no subject)"
                style={{ flex: 1, fontSize: "0.85rem", fontWeight: 500, background: "transparent", border: "none", outline: "none", color: "var(--text-bright)", padding: 0 }}
              />
            </div>
          </div>

          {/* Email body — editable */}
          <div style={{ padding: "1rem" }}>
            <textarea
              value={body}
              onChange={(e) => { setBody(e.target.value); setDraft(e.target.value); }}
              rows={12}
              style={{
                width: "100%",
                resize: "vertical",
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "0.875rem",
                lineHeight: 1.7,
                color: "var(--text-bright)",
                fontFamily: "inherit",
                padding: 0,
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ borderTop: "1px solid var(--border)", padding: "0.75rem 1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button onClick={copyDraft} className="btn-ghost" style={{ fontSize: "0.8rem" }}>
              {copied ? "Copied!" : "Copy"}
            </button>
            {recordId && recordType && (
              <>
                <input
                  type="text"
                  value={savedLabel}
                  onChange={(e) => setSavedLabel(e.target.value)}
                  placeholder="Label (optional)"
                  style={{ flex: 1, fontSize: "0.8rem" }}
                />
                <button onClick={saveDraft} disabled={saving} className="btn-ghost" style={{ fontSize: "0.8rem" }}>
                  {saving ? "Saving…" : "Save draft"}
                </button>
              </>
            )}
            {contactEmail && (
              <button
                onClick={sendEmail}
                disabled={sending || !body || !subject}
                className="btn-primary"
                style={{ fontSize: "0.8rem", marginLeft: "auto" }}
              >
                {sent ? "✓ Sent!" : sending ? "Sending…" : `Send to ${contactEmail}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
