"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { addPayment, deletePayment } from "@/app/admin/(dashboard)/reviewers/[id]/actions";

type Payment = {
  id:             string;
  amount:         number;
  currency:       string;
  paid_at:        string;
  description:    string | null;
  transaction_id: string | null;
  proof_url:      string | null;
};

type Props = {
  reviewerId: string;
  initialPayments: Payment[];
};

export function ReviewerPaymentPanel({ reviewerId, initialPayments }: Props) {
  const [payments, setPayments]       = useState<Payment[]>(initialPayments);
  const [showForm, setShowForm]       = useState(false);
  const [isPending, startTransition]   = useTransition();
  const [error, setError]             = useState("");
  const [formError, setFormError]     = useState("");

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  function handleDelete(id: string) {
    if (!confirm("Delete this payment record?")) return;
    setError("");
    const prev = payments;
    setPayments((ps) => ps.filter((p) => p.id !== id));
    startTransition(async () => {
      const result = await deletePayment(id);
      if ("error" in result) {
        setPayments(prev);
        setError(result.error);
      }
    });
  }

  async function handleAddPayment(fd: FormData) {
    setFormError("");
    const result = await addPayment(reviewerId, fd);
    if ("error" in result) {
      setFormError(result.error);
      return;
    }
    if ("payment" in result) {
      setPayments((ps) => [result.payment as Payment, ...ps]);
      setShowForm(false);
    }
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: "#e8f4ff", fontFamily: "var(--font-serif, serif)" }}>
            Payments
          </h3>
          {payments.length > 0 && (
            <p className="text-xs mt-0.5" style={{ color: "rgba(232,244,255,0.4)" }}>
              Total paid: <span style={{ color: "#2ecc71" }}>€{total.toFixed(2)}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
          style={{ background: "rgba(45,156,219,0.1)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.2)" }}
        >
          <Plus size={12} />
          {showForm ? "Cancel" : "Add Payment"}
        </button>
      </div>

      {/* Add payment form */}
      {showForm && (
        <form
          action={handleAddPayment}
          className="mb-5 p-4 rounded-lg space-y-3"
          style={{ background: "rgba(45,156,219,0.04)", border: "1px solid rgba(45,156,219,0.12)" }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "rgba(232,244,255,0.5)" }}>Amount (€) *</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8f4ff" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "rgba(232,244,255,0.5)" }}>Date *</label>
              <input
                name="paid_at"
                type="date"
                required
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8f4ff" }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "rgba(232,244,255,0.5)" }}>Description</label>
            <input
              name="description"
              type="text"
              placeholder="e.g. Review fee — Acme Corp diagnostic"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8f4ff" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "rgba(232,244,255,0.5)" }}>Transaction ID</label>
              <input
                name="transaction_id"
                type="text"
                placeholder="Bank ref or PayPal ID"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8f4ff" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "rgba(232,244,255,0.5)" }}>Proof URL</label>
              <input
                name="proof_url"
                type="url"
                placeholder="https://…"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8f4ff" }}
              />
            </div>
          </div>
          {formError && <p className="text-xs" style={{ color: "#e05252" }}>{formError}</p>}
          <button
            type="submit"
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg"
            style={{ background: "rgba(46,204,113,0.1)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.2)" }}
          >
            <Plus size={13} />
            Save Payment
          </button>
        </form>
      )}

      {/* Payments table */}
      {payments.length === 0 ? (
        <p className="text-sm py-4 text-center" style={{ color: "rgba(232,244,255,0.25)" }}>
          No payments recorded yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Date", "Description", "Amount", "Transaction ID", "Proof", ""].map((h) => (
                  <th key={h} className="pb-2 text-left text-xs font-medium pr-4" style={{ color: "rgba(232,244,255,0.35)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="py-2.5 pr-4 whitespace-nowrap" style={{ color: "rgba(232,244,255,0.6)" }}>
                    {new Date(p.paid_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-2.5 pr-4" style={{ color: "#e8f4ff" }}>
                    {p.description ?? <span style={{ color: "rgba(232,244,255,0.25)" }}>—</span>}
                  </td>
                  <td className="py-2.5 pr-4 font-medium whitespace-nowrap" style={{ color: "#2ecc71" }}>
                    €{Number(p.amount).toFixed(2)}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs" style={{ color: "rgba(232,244,255,0.5)" }}>
                    {p.transaction_id ?? <span style={{ color: "rgba(232,244,255,0.2)" }}>—</span>}
                  </td>
                  <td className="py-2.5 pr-4">
                    {p.proof_url ? (
                      <a
                        href={p.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs"
                        style={{ color: "#2d9cdb" }}
                      >
                        <ExternalLink size={11} />
                        Proof
                      </a>
                    ) : (
                      <span style={{ color: "rgba(232,244,255,0.2)" }}>—</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={isPending}
                      className="p-1 rounded"
                      style={{ color: "rgba(224,82,82,0.5)" }}
                      title="Delete payment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="mt-3 pt-3 flex justify-end" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-sm font-semibold" style={{ color: "#2ecc71" }}>
              Total: €{total.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs" style={{ color: "#e05252" }}>{error}</p>}
    </div>
  );
}
