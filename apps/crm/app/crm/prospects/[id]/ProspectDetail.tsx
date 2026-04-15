"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProspectStatusBadge, IcpBadge } from "@/components/StatusBadge";
import AnalyzerPanel from "@/components/AnalyzerPanel";
import DraftPanel from "@/components/DraftPanel";

const PROSPECT_STATUSES = ["new", "contacted", "in_conversation", "won", "lost"];

interface Message {
  id: string;
  label: string;
  content: string;
  created_at: string;
}

interface Prospect {
  id: string;
  name: string | null;
  company: string;
  url: string | null;
  linkedin_url: string | null;
  contact_email: string | null;
  status: string;
  icp_score: string | null;
  icp_report: string | null;
  notes: string | null;
  created_at: string;
}

export default function ProspectDetail({
  prospect: initialProspect,
  messages: initialMessages,
}: {
  prospect: Prospect;
  messages: Message[];
}) {
  const router = useRouter();
  const [prospect, setProspect] = useState(initialProspect);
  const [messages, setMessages] = useState(initialMessages);
  const [activeTab, setActiveTab] = useState<"info" | "analyze" | "draft" | "saved">("info");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...initialProspect });
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);
  const [deletingMsg, setDeletingMsg] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function saveInfo() {
    setSaving(true);
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          company: form.company,
          url: form.url,
          linkedin_url: form.linkedin_url,
          contact_email: form.contact_email,
          status: form.status,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      setProspect(data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(status: string) {
    const res = await fetch(`/api/prospects/${prospect.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setProspect(data);
  }

  async function deleteProspect() {
    if (!confirm(`Delete ${prospect.company}? This cannot be undone.`)) return;
    await fetch(`/api/prospects/${prospect.id}`, { method: "DELETE" });
    router.push("/crm/prospects");
  }

  async function deleteMessage(msgId: string) {
    setDeletingMsg(msgId);
    await fetch(`/api/messages?id=${msgId}&type=prospect`, { method: "DELETE" });
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setDeletingMsg(null);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "1.25rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
        <Link href="/crm/prospects" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
          Prospects
        </Link>
        {" / "}
        <span style={{ color: "var(--text-bright)" }}>{prospect.company}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 600, marginBottom: "0.25rem" }}>{prospect.company}</h1>
          {prospect.name && <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{prospect.name}</p>}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <ProspectStatusBadge status={prospect.status} />
            {prospect.icp_score && <IcpBadge score={prospect.icp_score} />}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <select
            value={prospect.status}
            onChange={(e) => changeStatus(e.target.value)}
            style={{ width: "auto" }}
          >
            {PROSPECT_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
          <button onClick={deleteProspect} className="btn-danger">Delete</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-nav">
        {(["info", "analyze", "draft", "saved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
          >
            {tab === "info" ? "Info" : tab === "analyze" ? "Analyze" : tab === "draft" ? "Draft" : `Saved (${messages.length})`}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {activeTab === "info" && (
        <div className="card">
          {!editing ? (
            <div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
                <button onClick={() => setEditing(true)} className="btn-ghost">Edit</button>
              </div>
              <dl style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "0.75rem 1rem", fontSize: "0.875rem" }}>
                <InfoRow label="Company" value={prospect.company} />
                <InfoRow label="Contact" value={prospect.name} />
                <InfoRow label="Email" value={prospect.contact_email} />
                <InfoRow label="Website" value={prospect.url} isLink />
                <InfoRow label="LinkedIn" value={prospect.linkedin_url} isLink />
                <InfoRow label="Status" value={prospect.status} />
                <InfoRow label="Notes" value={prospect.notes} />
                <InfoRow label="Added" value={new Date(prospect.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} />
              </dl>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Company *</label>
                  <input type="text" value={form.company ?? ""} onChange={(e) => set("company", e.target.value)} />
                </div>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Contact name</label>
                  <input type="text" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Website URL</label>
                  <input type="url" value={form.url ?? ""} onChange={(e) => set("url", e.target.value)} />
                </div>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Contact email</label>
                  <input type="email" value={form.contact_email ?? ""} onChange={(e) => set("contact_email", e.target.value)} />
                </div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>LinkedIn URL</label>
                <input type="url" value={form.linkedin_url ?? ""} onChange={(e) => set("linkedin_url", e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Notes</label>
                <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={3} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
                <button onClick={saveInfo} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save"}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analyze tab */}
      {activeTab === "analyze" && (
        <div className="card">
          <AnalyzerPanel
            prospectId={prospect.id}
            url={prospect.url ?? ""}
            notes={prospect.notes ?? ""}
            existingReport={prospect.icp_report}
            onComplete={(result) => setProspect((p) => ({ ...p, icp_score: result.score, icp_report: JSON.stringify(result) }))}
          />
        </div>
      )}

      {/* Draft tab */}
      {activeTab === "draft" && (
        <div className="card">
          <DraftPanel
            recordId={prospect.id}
            recordType="prospect"
            defaultType="prospect_outreach"
            contactEmail={prospect.contact_email ?? undefined}
            contactName={prospect.name ?? undefined}
            onSaved={(msg) => {
              setMessages((prev) => [msg as Message, ...prev]);
              setActiveTab("saved");
            }}
          />
        </div>
      )}

      {/* Saved messages tab */}
      {activeTab === "saved" && (
        <div>
          {messages.length === 0 ? (
            <div className="empty-state">No saved messages — draft one in the Draft tab.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {messages.map((msg) => (
                <div key={msg.id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--accent-gold)" }}>{msg.label || "Draft"}</span>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                        {new Date(msg.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="btn-ghost"
                        style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => setExpandedMsg(expandedMsg === msg.id ? null : msg.id)}
                        className="btn-ghost"
                        style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}
                      >
                        {expandedMsg === msg.id ? "Collapse" : "Expand"}
                      </button>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        disabled={deletingMsg === msg.id}
                        className="btn-danger"
                        style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: "0.85rem",
                      lineHeight: 1.6,
                      margin: 0,
                      color: "var(--text-bright)",
                      fontFamily: "inherit",
                      maxHeight: expandedMsg === msg.id ? "none" : 80,
                      overflow: "hidden",
                    }}
                  >
                    {msg.content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, isLink }: { label: string; value: string | null | undefined; isLink?: boolean }) {
  if (!value) return (
    <>
      <dt style={{ color: "var(--text-dim)" }}>{label}</dt>
      <dd style={{ margin: 0, color: "var(--text-dim)" }}>—</dd>
    </>
  );
  return (
    <>
      <dt style={{ color: "var(--text-muted)" }}>{label}</dt>
      <dd style={{ margin: 0 }}>
        {isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>
            {value}
          </a>
        ) : value}
      </dd>
    </>
  );
}
