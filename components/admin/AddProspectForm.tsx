"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddProspectForm() {
  const router = useRouter();

  const [open,         setOpen]         = useState(false);
  const [companyName,  setCompanyName]  = useState("");
  const [websiteUrl,   setWebsiteUrl]   = useState("");
  const [contactName,  setContactName]  = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  async function handleAdd() {
    if (!companyName.trim() || !contactEmail.trim()) {
      setError("Company name and contact email are required.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/leads", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ companyName, websiteUrl, contactName, contactEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");

      // Navigate to the new prospect's detail page
      router.push(`/admin/demo-requests/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add prospect");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary"
        style={{ fontSize: "0.82rem" }}
      >
        + Add Prospect
      </button>
    );
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.2)" }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#2d9cdb" }}>
        Add Prospect
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Company Name *</label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="e.g. Carv"
            disabled={loading}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Website URL</label>
          <input
            type="url"
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
            placeholder="https://carv.com"
            disabled={loading}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Contact Name</label>
          <input
            type="text"
            value={contactName}
            onChange={e => setContactName(e.target.value)}
            placeholder="e.g. Barend Raaff"
            disabled={loading}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Contact Email *</label>
          <input
            type="email"
            value={contactEmail}
            onChange={e => setContactEmail(e.target.value)}
            placeholder="barend@carv.com"
            disabled={loading}
          />
        </div>
      </div>

      {error && (
        <p style={{ color: "var(--red)", fontSize: "0.82rem", marginTop: "0.75rem", marginBottom: 0 }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button
          onClick={handleAdd}
          disabled={loading || !companyName.trim() || !contactEmail.trim()}
          className="btn-primary"
          style={{ fontSize: "0.82rem" }}
        >
          {loading ? <><span className="loading-spinner" style={{ marginRight: 6 }} />Adding…</> : "Add Prospect →"}
        </button>
        <button
          onClick={() => { setOpen(false); setError(""); }}
          disabled={loading}
          className="btn-ghost"
          style={{ fontSize: "0.82rem" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
