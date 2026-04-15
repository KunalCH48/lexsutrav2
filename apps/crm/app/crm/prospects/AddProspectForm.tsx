"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddProspectForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company: "",
    name: "",
    url: "",
    linkedin_url: "",
    contact_email: "",
    notes: "",
  });
  const router = useRouter();

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company) return;
    setLoading(true);
    try {
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setOpen(false);
      setForm({ company: "", name: "", url: "", linkedin_url: "", contact_email: "", notes: "" });
      router.push(`/crm/prospects/${data.id}`);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        + Add Prospect
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100,
        }}
      />
      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "1.75rem",
          width: "100%",
          maxWidth: 480,
          zIndex: 101,
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.25rem" }}>Add Prospect</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Company *</label>
            <input type="text" value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Acme AI" required />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Contact name</label>
            <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Smith" />
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Website URL</label>
              <input type="url" value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://…" />
            </div>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Contact email</label>
              <input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} placeholder="jane@…" />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>LinkedIn URL</label>
            <input type="url" value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/…" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Notes</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="How you found them, initial impressions…" />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={loading || !form.company} className="btn-primary">
              {loading ? "Adding…" : "Add Prospect"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
