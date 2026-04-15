"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { JobStatusBadge } from "@/components/StatusBadge";
import DraftPanel from "@/components/DraftPanel";

const JOB_STATUSES = ["applied", "screening", "interview", "offer", "rejected", "withdrawn"];

interface Message {
  id: string;
  label: string;
  content: string;
  created_at: string;
}

interface Job {
  id: string;
  company: string;
  role: string;
  url: string | null;
  contact_name: string | null;
  contact_title: string | null;
  contact_linkedin: string | null;
  status: string;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
}

export default function JobDetail({
  job: initialJob,
  messages: initialMessages,
}: {
  job: Job;
  messages: Message[];
}) {
  const router = useRouter();
  const [job, setJob] = useState(initialJob);
  const [messages, setMessages] = useState(initialMessages);
  const [activeTab, setActiveTab] = useState<"info" | "draft" | "saved">("info");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...initialJob });
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);
  const [deletingMsg, setDeletingMsg] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function saveInfo() {
    setSaving(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: form.company,
          role: form.role,
          url: form.url,
          contact_name: form.contact_name,
          contact_title: form.contact_title,
          contact_linkedin: form.contact_linkedin,
          notes: form.notes,
          applied_at: form.applied_at,
        }),
      });
      const data = await res.json();
      setJob(data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(status: string) {
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setJob(data);
  }

  async function deleteJob() {
    if (!confirm(`Delete application to ${job.company}? This cannot be undone.`)) return;
    await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
    router.push("/crm/jobs");
  }

  async function deleteMessage(msgId: string) {
    setDeletingMsg(msgId);
    await fetch(`/api/messages?id=${msgId}&type=job`, { method: "DELETE" });
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setDeletingMsg(null);
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: "1.25rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
        <Link href="/crm/jobs" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Jobs</Link>
        {" / "}
        <span style={{ color: "var(--text-bright)" }}>{job.company} — {job.role}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 600, marginBottom: "0.25rem" }}>{job.role}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{job.company}</p>
          <div style={{ marginTop: "0.5rem" }}>
            <JobStatusBadge status={job.status} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <select value={job.status} onChange={(e) => changeStatus(e.target.value)} style={{ width: "auto" }}>
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button onClick={deleteJob} className="btn-danger">Delete</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-nav">
        {(["info", "draft", "saved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
          >
            {tab === "info" ? "Info" : tab === "draft" ? "Draft" : `Saved (${messages.length})`}
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
                <InfoRow label="Company" value={job.company} />
                <InfoRow label="Role" value={job.role} />
                <InfoRow label="Job URL" value={job.url} isLink />
                <InfoRow label="Applied" value={job.applied_at ? new Date(job.applied_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null} />
                <InfoRow label="Contact" value={job.contact_name} />
                <InfoRow label="Title" value={job.contact_title} />
                <InfoRow label="LinkedIn" value={job.contact_linkedin} isLink />
                <InfoRow label="Notes" value={job.notes} />
              </dl>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Company *</label>
                  <input type="text" value={form.company} onChange={(e) => set("company", e.target.value)} />
                </div>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Role *</label>
                  <input type="text" value={form.role} onChange={(e) => set("role", e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Job URL</label>
                  <input type="url" value={form.url ?? ""} onChange={(e) => set("url", e.target.value)} />
                </div>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Applied on</label>
                  <input type="date" value={form.applied_at ?? ""} onChange={(e) => set("applied_at", e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Contact name</label>
                  <input type="text" value={form.contact_name ?? ""} onChange={(e) => set("contact_name", e.target.value)} />
                </div>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Contact title</label>
                  <input type="text" value={form.contact_title ?? ""} onChange={(e) => set("contact_title", e.target.value)} />
                </div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Contact LinkedIn</label>
                <input type="url" value={form.contact_linkedin ?? ""} onChange={(e) => set("contact_linkedin", e.target.value)} />
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

      {/* Draft tab */}
      {activeTab === "draft" && (
        <div className="card">
          <DraftPanel
            recordId={job.id}
            recordType="job"
            defaultType="job_followup"
            onSaved={(msg) => {
              setMessages((prev) => [msg as Message, ...prev]);
              setActiveTab("saved");
            }}
          />
        </div>
      )}

      {/* Saved messages */}
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
