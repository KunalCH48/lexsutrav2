"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddJobForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company: "",
    role: "",
    url: "",
    contact_name: "",
    contact_title: "",
    contact_linkedin: "",
    notes: "",
    applied_at: new Date().toISOString().split("T")[0],
  });
  const router = useRouter();

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company || !form.role) return;
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setOpen(false);
      router.push(`/crm/jobs/${data.id}`);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        + Add Application
      </button>
    );
  }

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100 }}
      />
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
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.25rem" }}>Add Job Application</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Company *</label>
              <input type="text" value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Stripe" required />
            </div>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Role *</label>
              <input type="text" value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="Senior Engineer" required />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Job URL</label>
              <input type="url" value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://…" />
            </div>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Applied on</label>
              <input type="date" value={form.applied_at} onChange={(e) => set("applied_at", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Contact name</label>
              <input type="text" value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Contact title</label>
              <input type="text" value={form.contact_title} onChange={(e) => set("contact_title", e.target.value)} />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Contact LinkedIn</label>
            <input type="url" value={form.contact_linkedin} onChange={(e) => set("contact_linkedin", e.target.value)} placeholder="https://linkedin.com/in/…" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Notes</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={loading || !form.company || !form.role} className="btn-primary">
              {loading ? "Adding…" : "Add Application"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
