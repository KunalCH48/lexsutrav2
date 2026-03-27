"use client";

import { useState, useTransition } from "react";

export type Invoice = {
  id:             string;
  invoice_number: string;
  status:         "draft" | "sent" | "paid" | "cancelled";
  amount:         number;
  tier:           string | null;
  description:    string | null;
  issued_at:      string;
  due_at:         string;
  paid_at:        string | null;
  notes:          string | null;
};

type Props = {
  companyId:      string;
  companyName:    string;
  contactEmail:   string;
  initialInvoices: Invoice[];
};

const TIERS = [
  { value: "starter",      label: "Starter",      price: 300  },
  { value: "core",         label: "Core",         price: 2200 },
  { value: "premium",      label: "Premium",      price: 3500 },
  { value: "full_package", label: "Full Package", price: 4500 },
];

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtEur(n: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency", currency: "EUR", minimumFractionDigits: 0,
  }).format(n);
}

function StatusBadge({ status }: { status: Invoice["status"] }) {
  const MAP = {
    draft:     { label: "Draft",     bg: "rgba(255,255,255,0.06)", color: "#8899aa" },
    sent:      { label: "Sent",      bg: "rgba(45,156,219,0.12)", color: "#2d9cdb" },
    paid:      { label: "Paid",      bg: "rgba(46,204,113,0.12)", color: "#2ecc71" },
    cancelled: { label: "Cancelled", bg: "rgba(224,82,82,0.1)",   color: "#e05252" },
  };
  const { label, bg, color } = MAP[status] ?? MAP.draft;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}

export function InvoicePanel({ companyId, companyName, contactEmail, initialInvoices }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [tier, setTier]             = useState("core");
  const [description, setDescription] = useState("");
  const [notes, setNotes]           = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError]           = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Per-invoice UI state
  const [sendConfirm, setSendConfirm]   = useState<string | null>(null); // invoiceId awaiting send confirm
  const [sendEmail, setSendEmail]       = useState(contactEmail);
  const [paidConfirm, setPaidConfirm]   = useState<string | null>(null); // invoiceId awaiting paid confirm
  const [loadingAction, setLoadingAction] = useState<string | null>(null); // "generate" | `send-${id}` | `paid-${id}` | `dl-${id}`

  function flash(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  async function handleGenerate() {
    setError(null);
    setLoadingAction("generate");
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/invoices/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            tier,
            description: description.trim() || undefined,
            notes:       notes.trim()       || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Generation failed"); return; }

        // Refresh invoice list
        const listRes = await fetch(`/api/admin/invoices/list?companyId=${companyId}`);
        if (listRes.ok) {
          const { invoices: fresh } = await listRes.json();
          setInvoices(fresh);
        } else {
          // Optimistically add a placeholder — page reload will fix it
          setInvoices(prev => [{
            id:             data.invoiceId,
            invoice_number: data.invoiceNumber,
            status:         "draft",
            amount:         TIERS.find(t => t.value === tier)?.price ?? 0,
            tier,
            description:    description.trim() || null,
            issued_at:      new Date().toISOString(),
            due_at:         new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            paid_at:        null,
            notes:          notes.trim() || null,
          }, ...prev]);
        }

        // Open PDF download immediately
        if (data.signedUrl) window.open(data.signedUrl, "_blank");

        setDescription("");
        setNotes("");
        flash(`Invoice ${data.invoiceNumber} generated.`);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoadingAction(null);
      }
    });
  }

  async function handleDownload(invoiceId: string) {
    setLoadingAction(`dl-${invoiceId}`);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/pdf`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Download failed"); return; }
      window.open(data.url, "_blank");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleSendEmail(invoiceId: string) {
    setError(null);
    setLoadingAction(`send-${invoiceId}`);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: sendEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Send failed"); return; }

      setInvoices(prev => prev.map(inv =>
        inv.id === invoiceId ? { ...inv, status: "sent" } : inv
      ));
      setSendConfirm(null);
      flash(`Invoice emailed to ${sendEmail}.`);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleMarkPaid(invoiceId: string) {
    setError(null);
    setLoadingAction(`paid-${invoiceId}`);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/mark-paid`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Update failed"); return; }

      setInvoices(prev => prev.map(inv =>
        inv.id === invoiceId ? { ...inv, status: "paid", paid_at: data.paidAt } : inv
      ));
      setPaidConfirm(null);
      flash("Invoice marked as paid.");
    } finally {
      setLoadingAction(null);
    }
  }

  const selectedTierPrice = TIERS.find(t => t.value === tier)?.price ?? 0;

  return (
    <div>
      {/* Success / error banners */}
      {successMsg && (
        <div className="mb-3 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(46,204,113,0.1)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.2)" }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-3 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(224,82,82,0.08)", color: "#e05252", border: "1px solid rgba(224,82,82,0.2)" }}>
          {error}
        </div>
      )}

      {/* Generate form */}
      <div className="mb-5 pb-5" style={{ borderBottom: "1px solid rgba(45,156,219,0.08)" }}>
        <p className="text-xs font-medium mb-3" style={{ color: "#8899aa" }}>New Invoice</p>

        {/* Tier selector */}
        <div className="flex flex-wrap gap-2 mb-3">
          {TIERS.map(t => (
            <button
              key={t.value}
              onClick={() => setTier(t.value)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: tier === t.value ? "rgba(45,156,219,0.15)" : "rgba(255,255,255,0.04)",
                border:     tier === t.value ? "1px solid rgba(45,156,219,0.4)" : "1px solid rgba(255,255,255,0.07)",
                color:      tier === t.value ? "#2d9cdb" : "#8899aa",
              }}
            >
              {t.label} · {fmtEur(t.price)}
            </button>
          ))}
        </div>

        {/* Optional description */}
        <input
          type="text"
          placeholder="Description (optional — defaults to tier name)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full text-xs rounded-lg px-3 py-2 mb-2 outline-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(45,156,219,0.12)", color: "#e8f4ff" }}
        />

        {/* Optional notes */}
        <textarea
          placeholder="Notes for client (optional — appears on PDF)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          className="w-full text-xs rounded-lg px-3 py-2 mb-3 outline-none resize-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(45,156,219,0.12)", color: "#e8f4ff" }}
        />

        <button
          onClick={handleGenerate}
          disabled={loadingAction === "generate" || isPending}
          className="text-xs px-4 py-2 rounded-lg font-medium"
          style={{
            background: "rgba(45,156,219,0.15)",
            border:     "1px solid rgba(45,156,219,0.35)",
            color:      "#2d9cdb",
            opacity:    loadingAction === "generate" ? 0.6 : 1,
          }}
        >
          {loadingAction === "generate" ? "Generating…" : `Generate Invoice — ${fmtEur(selectedTierPrice)}`}
        </button>
      </div>

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <p className="text-xs" style={{ color: "#3d4f60" }}>No invoices yet.</p>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <div
              key={inv.id}
              className="rounded-lg px-4 py-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(45,156,219,0.06)" }}
            >
              {/* Row 1: number + status + amount */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "#e8f4ff", fontFamily: "monospace" }}>
                    {inv.invoice_number}
                  </span>
                  <StatusBadge status={inv.status} />
                </div>
                <span className="text-sm font-semibold" style={{ color: "#c8a84b" }}>
                  {fmtEur(inv.amount)}
                </span>
              </div>

              {/* Row 2: description + dates */}
              <p className="text-xs mb-1 truncate" style={{ color: "#5a6a7a" }}>
                {inv.description ?? inv.tier ?? "Invoice"}
              </p>
              <div className="flex items-center gap-3 text-xs" style={{ color: "#3d4f60" }}>
                <span>Issued {fmtDate(inv.issued_at)}</span>
                <span>·</span>
                <span>Due {fmtDate(inv.due_at)}</span>
                {inv.status === "paid" && inv.paid_at && (
                  <>
                    <span>·</span>
                    <span style={{ color: "#2ecc71" }}>✓ Paid {fmtDate(inv.paid_at)}</span>
                  </>
                )}
              </div>

              {/* Actions */}
              {inv.status !== "paid" && inv.status !== "cancelled" && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {/* Download */}
                  <button
                    onClick={() => handleDownload(inv.id)}
                    disabled={loadingAction === `dl-${inv.id}`}
                    className="text-xs px-2.5 py-1 rounded"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#8899aa", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {loadingAction === `dl-${inv.id}` ? "…" : "Download PDF"}
                  </button>

                  {/* Send email */}
                  {sendConfirm === inv.id ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <input
                        type="email"
                        value={sendEmail}
                        onChange={e => setSendEmail(e.target.value)}
                        className="text-xs rounded px-2 py-1 outline-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(45,156,219,0.2)", color: "#e8f4ff", minWidth: 180 }}
                      />
                      <button
                        onClick={() => handleSendEmail(inv.id)}
                        disabled={loadingAction === `send-${inv.id}`}
                        className="text-xs px-2.5 py-1 rounded"
                        style={{ background: "rgba(45,156,219,0.15)", border: "1px solid rgba(45,156,219,0.35)", color: "#2d9cdb" }}
                      >
                        {loadingAction === `send-${inv.id}` ? "Sending…" : "Send"}
                      </button>
                      <button
                        onClick={() => setSendConfirm(null)}
                        className="text-xs px-2 py-1 rounded"
                        style={{ color: "#3d4f60" }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setSendEmail(contactEmail); setSendConfirm(inv.id); }}
                      className="text-xs px-2.5 py-1 rounded"
                      style={{ background: "rgba(45,156,219,0.08)", border: "1px solid rgba(45,156,219,0.15)", color: "#2d9cdb" }}
                    >
                      Send Email
                    </button>
                  )}

                  {/* Mark Paid */}
                  {paidConfirm === inv.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs" style={{ color: "#8899aa" }}>Mark as paid?</span>
                      <button
                        onClick={() => handleMarkPaid(inv.id)}
                        disabled={loadingAction === `paid-${inv.id}`}
                        className="text-xs px-2.5 py-1 rounded"
                        style={{ background: "rgba(46,204,113,0.12)", border: "1px solid rgba(46,204,113,0.25)", color: "#2ecc71" }}
                      >
                        {loadingAction === `paid-${inv.id}` ? "…" : "Confirm Paid"}
                      </button>
                      <button
                        onClick={() => setPaidConfirm(null)}
                        className="text-xs px-2 py-1 rounded"
                        style={{ color: "#3d4f60" }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setPaidConfirm(inv.id)}
                      className="text-xs px-2.5 py-1 rounded"
                      style={{ background: "rgba(46,204,113,0.06)", border: "1px solid rgba(46,204,113,0.15)", color: "#2ecc71" }}
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              )}

              {/* Paid: download only */}
              {inv.status === "paid" && (
                <div className="mt-3">
                  <button
                    onClick={() => handleDownload(inv.id)}
                    disabled={loadingAction === `dl-${inv.id}`}
                    className="text-xs px-2.5 py-1 rounded"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#8899aa", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {loadingAction === `dl-${inv.id}` ? "…" : "Download PDF"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
