import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic  = "force-dynamic";
export const metadata = { title: "Invoices — LexSutra Admin" };

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtEur(n: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency", currency: "EUR", minimumFractionDigits: 0,
  }).format(n);
}

const STATUS_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  draft:     { bg: "rgba(255,255,255,0.06)",  color: "#8899aa", label: "Draft"     },
  sent:      { bg: "rgba(45,156,219,0.12)",   color: "#2d9cdb", label: "Sent"      },
  paid:      { bg: "rgba(46,204,113,0.12)",   color: "#2ecc71", label: "Paid"      },
  cancelled: { bg: "rgba(224,82,82,0.1)",     color: "#e05252", label: "Cancelled" },
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const adminClient = createSupabaseAdminClient();

  // Fetch all invoices joined with company name
  const { data: rows } = await adminClient
    .from("invoices")
    .select("id, invoice_number, status, amount, tier, issued_at, due_at, paid_at, company_id, companies(name)")
    .order("issued_at", { ascending: false });

  const allInvoices = (rows ?? []) as Array<{
    id:             string;
    invoice_number: string;
    status:         string;
    amount:         number;
    tier:           string | null;
    issued_at:      string;
    due_at:         string;
    paid_at:        string | null;
    company_id:     string;
    companies:      { name: string } | null;
  }>;

  // Filter
  const filtered =
    filter === "unpaid"
      ? allInvoices.filter(i => i.status !== "paid" && i.status !== "cancelled")
      : filter === "paid"
        ? allInvoices.filter(i => i.status === "paid")
        : allInvoices;

  // Totals
  const totalRevenue = allInvoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const pipeline     = allInvoices.filter(i => i.status === "sent").reduce((s, i) => s + i.amount, 0);

  const tabs = [
    { label: "All",    value: undefined,  count: allInvoices.length },
    { label: "Unpaid", value: "unpaid",   count: allInvoices.filter(i => i.status !== "paid" && i.status !== "cancelled").length },
    { label: "Paid",   value: "paid",     count: allInvoices.filter(i => i.status === "paid").length },
  ];

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
        >
          Invoices
        </h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Revenue Collected", value: fmtEur(totalRevenue), color: "#c8a84b" },
          { label: "In Pipeline (Sent)", value: fmtEur(pipeline),   color: "#2d9cdb" },
          { label: "Total Invoices",    value: allInvoices.length,  color: "#e8f4ff" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.12)" }}>
            <p className="text-xs mb-1" style={{ color: "#3d4f60" }}>{label}</p>
            <p className="text-xl font-semibold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4">
        {tabs.map(tab => {
          const active = (filter ?? undefined) === tab.value;
          const href   = tab.value ? `/admin/invoices?filter=${tab.value}` : "/admin/invoices";
          return (
            <Link
              key={tab.label}
              href={href}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{
                background: active ? "rgba(45,156,219,0.15)" : "rgba(255,255,255,0.04)",
                border:     active ? "1px solid rgba(45,156,219,0.35)" : "1px solid rgba(255,255,255,0.07)",
                color:      active ? "#2d9cdb" : "#8899aa",
              }}
            >
              {tab.label} ({tab.count})
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.12)" }}>
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm" style={{ color: "#3d4f60" }}>No invoices found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(45,156,219,0.1)" }}>
                {["Invoice #", "Company", "Amount", "Status", "Issued", "Due / Paid", ""].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium tracking-wide"
                    style={{ color: "#3d4f60" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => {
                const { bg, color, label } = STATUS_COLOR[inv.status] ?? STATUS_COLOR.draft;
                return (
                  <tr
                    key={inv.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? "1px solid rgba(45,156,219,0.06)" : "none",
                    }}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium" style={{ fontFamily: "monospace", color: "#e8f4ff" }}>
                        {inv.invoice_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/clients/${inv.company_id}`} className="text-xs hover:underline" style={{ color: "#2d9cdb" }}>
                        {inv.companies?.name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold" style={{ color: "#c8a84b" }}>
                        {fmtEur(inv.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: "#8899aa" }}>{fmtDate(inv.issued_at)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.status === "paid" && inv.paid_at ? (
                        <span className="text-xs" style={{ color: "#2ecc71" }}>✓ {fmtDate(inv.paid_at)}</span>
                      ) : (
                        <span className="text-xs" style={{ color: "#3d4f60" }}>{fmtDate(inv.due_at)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/clients/${inv.company_id}`} className="text-xs" style={{ color: "#2d9cdb" }}>
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
