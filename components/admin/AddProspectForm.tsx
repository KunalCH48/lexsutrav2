"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type CRMProspect = {
  id: string;
  company: string;
  name: string | null;
  url: string | null;
  contact_email: string | null;
  icp_score: "strong" | "possible" | "unlikely" | null;
  status: string | null;
};

const ICP_COLOURS: Record<string, { bg: string; color: string }> = {
  strong:   { bg: "rgba(46,204,113,0.12)",  color: "#2ecc71" },
  possible: { bg: "rgba(224,168,50,0.12)",  color: "#e0a832" },
  unlikely: { bg: "rgba(224,82,82,0.12)",   color: "#e05252" },
};

export default function AddProspectForm() {
  const router = useRouter();

  const [open,         setOpen]         = useState(false);
  const [mode,         setMode]         = useState<"manual" | "crm">("manual");

  // CRM picker state
  const [crmLoading,   setCrmLoading]   = useState(false);
  const [crmList,      setCrmList]      = useState<CRMProspect[]>([]);
  const [crmSearch,    setCrmSearch]    = useState("");

  // Form fields
  const [companyName,  setCompanyName]  = useState("");
  const [websiteUrl,   setWebsiteUrl]   = useState("");
  const [contactName,  setContactName]  = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [selectedCRM,  setSelectedCRM]  = useState<CRMProspect | null>(null);

  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  const searchRef = useRef<HTMLInputElement>(null);

  // Load CRM prospects when switching to CRM mode
  useEffect(() => {
    if (mode !== "crm" || crmList.length > 0) return;
    setCrmLoading(true);
    fetch("/api/admin/crm-prospects")
      .then(r => r.json())
      .then(data => { setCrmList(data ?? []); setCrmLoading(false); })
      .catch(() => setCrmLoading(false));
  }, [mode]);

  // Auto-focus search when CRM mode opens
  useEffect(() => {
    if (mode === "crm") setTimeout(() => searchRef.current?.focus(), 50);
  }, [mode]);

  function selectProspect(p: CRMProspect) {
    setSelectedCRM(p);
    setCompanyName(p.company ?? "");
    setWebsiteUrl(p.url ?? "");
    setContactName(p.name ?? "");
    setContactEmail(p.contact_email ?? "");
    setMode("manual"); // switch to form view with pre-filled fields
  }

  function handleClose() {
    setOpen(false);
    setMode("manual");
    setCompanyName("");
    setWebsiteUrl("");
    setContactName("");
    setContactEmail("");
    setSelectedCRM(null);
    setError("");
    setCrmSearch("");
  }

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
      router.push(`/admin/demo-requests/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add prospect");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary" style={{ fontSize: "0.82rem" }}>
        + Add Prospect
      </button>
    );
  }

  const filteredCRM = crmList.filter(p =>
    !crmSearch ||
    p.company.toLowerCase().includes(crmSearch.toLowerCase()) ||
    p.name?.toLowerCase().includes(crmSearch.toLowerCase()) ||
    p.contact_email?.toLowerCase().includes(crmSearch.toLowerCase())
  );

  return (
    <div className="rounded-xl p-5" style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.2)" }}>
      {/* Header + mode toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h3 className="text-sm font-semibold" style={{ color: "#2d9cdb" }}>
          Add Prospect
          {selectedCRM && (
            <span style={{ color: "#3d4f60", fontWeight: 400, marginLeft: "0.5rem" }}>
              — from CRM
            </span>
          )}
        </h3>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {(["manual", "crm"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                fontSize:     "0.75rem",
                padding:      "0.3rem 0.75rem",
                borderRadius: 6,
                border:       mode === m ? "1px solid rgba(45,156,219,0.4)" : "1px solid rgba(255,255,255,0.06)",
                background:   mode === m ? "rgba(45,156,219,0.12)" : "transparent",
                color:        mode === m ? "#2d9cdb" : "#3d4f60",
                cursor:       "pointer",
                transition:   "all 0.15s",
              }}
            >
              {m === "manual" ? "Manual" : "Pick from CRM"}
            </button>
          ))}
        </div>
      </div>

      {/* ── CRM picker ── */}
      {mode === "crm" && (
        <div>
          <input
            ref={searchRef}
            type="text"
            value={crmSearch}
            onChange={e => setCrmSearch(e.target.value)}
            placeholder="Search company, contact or email…"
            style={{
              width: "100%", padding: "0.5rem 0.75rem",
              background: "#111d2e", border: "1px solid rgba(45,156,219,0.2)",
              borderRadius: 8, color: "#e8f4ff", fontSize: "0.82rem",
              outline: "none", marginBottom: "0.75rem",
            }}
          />

          {crmLoading ? (
            <p style={{ color: "#3d4f60", fontSize: "0.82rem", padding: "0.5rem 0" }}>Loading CRM…</p>
          ) : filteredCRM.length === 0 ? (
            <p style={{ color: "#3d4f60", fontSize: "0.82rem", padding: "0.5rem 0" }}>
              {crmList.length === 0 ? "No CRM prospects found." : "No matches."}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: 320, overflowY: "auto" }}>
              {filteredCRM.map(p => {
                const icpStyle = p.icp_score ? ICP_COLOURS[p.icp_score] ?? {} : {};
                return (
                  <button
                    key={p.id}
                    onClick={() => selectProspect(p)}
                    style={{
                      display:       "flex",
                      alignItems:    "center",
                      justifyContent:"space-between",
                      padding:       "0.6rem 0.875rem",
                      borderRadius:  8,
                      border:        "1px solid rgba(45,156,219,0.1)",
                      background:    "rgba(255,255,255,0.02)",
                      cursor:        "pointer",
                      textAlign:     "left",
                      transition:    "background 0.12s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(45,156,219,0.07)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  >
                    <div>
                      <p style={{ color: "#e8f4ff", fontSize: "0.85rem", fontWeight: 500, margin: 0 }}>
                        {p.company}
                      </p>
                      <p style={{ color: "#3d4f60", fontSize: "0.75rem", margin: "0.15rem 0 0" }}>
                        {p.name ? `${p.name} · ` : ""}{p.contact_email ?? "no email"}
                      </p>
                    </div>
                    {p.icp_score && (
                      <span style={{
                        fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: 999,
                        ...icpStyle,
                      }}>
                        {p.icp_score}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Manual / pre-filled form ── */}
      {mode === "manual" && (
        <>
          {selectedCRM && (
            <div style={{
              fontSize: "0.75rem", color: "#3d4f60", marginBottom: "0.75rem",
              padding: "0.4rem 0.75rem", borderRadius: 6,
              background: "rgba(45,156,219,0.06)", border: "1px solid rgba(45,156,219,0.12)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span>Pre-filled from CRM — edit if needed</span>
              <button
                onClick={() => { setSelectedCRM(null); setCompanyName(""); setWebsiteUrl(""); setContactName(""); setContactEmail(""); }}
                style={{ color: "#3d4f60", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem" }}
              >
                Clear ×
              </button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Company Name *</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Carv" disabled={loading} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Website URL</label>
              <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
                placeholder="https://carv.com" disabled={loading} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Contact Name</label>
              <input type="text" value={contactName} onChange={e => setContactName(e.target.value)}
                placeholder="e.g. Barend Raaff" disabled={loading} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Contact Email *</label>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                placeholder="barend@carv.com" disabled={loading} />
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
              {loading
                ? <><span className="loading-spinner" style={{ marginRight: 6 }} />Adding…</>
                : "Add Prospect →"}
            </button>
            <button onClick={handleClose} disabled={loading} className="btn-ghost" style={{ fontSize: "0.82rem" }}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
