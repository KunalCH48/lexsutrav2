"use client";

import { useState } from "react";

export default function IcpEditor({
  initialDescription,
  updatedAt,
}: {
  initialDescription: string;
  updatedAt: string | null;
}) {
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(updatedAt);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/icp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLastUpdated(data.updated_at);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {lastUpdated
            ? `Last updated ${new Date(lastUpdated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
            : "Not yet saved"}
        </span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {saved && <span style={{ fontSize: "0.8rem", color: "var(--green)" }}>Saved</span>}
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save ICP"}
          </button>
        </div>
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
        <label>ICP Definition</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          placeholder="Describe your ideal customer: industry, size, stage, tech stack, geography, red flags…"
          style={{ resize: "vertical" }}
        />
      </div>

      {error && <p style={{ color: "var(--red)", fontSize: "0.85rem", marginTop: "0.75rem" }}>{error}</p>}

      <p style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.75rem" }}>
        Be specific. Include positive signals (must-haves), nice-to-haves, and hard red flags. The more detailed, the better the analysis.
      </p>
    </div>
  );
}
