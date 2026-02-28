import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { DataTable, TableRow, TableCell } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const metadata = { title: "Revenue — LexSutra Admin" };

// Tier prices — update as pricing changes
const TIER_PRICES: Record<string, number> = {
  starter:  300,
  core:     2200,
  premium:  3500,
  full:     4500,
};

function getTierPrice(tier: string | null): number {
  if (!tier) return 0;
  return TIER_PRICES[tier.toLowerCase()] ?? 0;
}

function fmtEur(amount: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default async function RevenuePage() {
  const adminClient = createSupabaseAdminClient();

  const { data: diagnostics } = await adminClient
    .from("diagnostics")
    .select(`
      id, status, created_at,
      ai_systems (
        name,
        companies ( name, email )
      )
    `)
    .eq("status", "delivered")
    .order("created_at", { ascending: false });

  // Also fetch all diagnostics for pipeline view
  const { data: allDiagnostics } = await adminClient
    .from("diagnostics")
    .select("id, status, created_at")
    .order("created_at", { ascending: false });

  const delivered = diagnostics ?? [];
  const all       = allDiagnostics ?? [];

  // NOTE: tier is not yet a column on diagnostics — using 'core' as default until
  // tier tracking is added to the schema. Replace with d.tier once column exists.
  const defaultTier = "core";

  // Totals
  const totalRevenue   = delivered.length * getTierPrice(defaultTier);
  const pipelineCount  = all.filter((d: { id: string; status: string; created_at: string }) => ["draft", "in_review"].includes(d.status)).length;
  const pipelineValue  = pipelineCount * getTierPrice(defaultTier);

  // Monthly breakdown
  const byMonth: Record<string, { count: number; revenue: number }> = {};
  for (const d of delivered) {
    const key = monthKey(d.created_at);
    if (!byMonth[key]) byMonth[key] = { count: 0, revenue: 0 };
    byMonth[key].count   += 1;
    byMonth[key].revenue += getTierPrice(defaultTier);
  }
  const months = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-semibold mb-1"
          style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
        >
          Revenue
        </h2>
        <p className="text-sm" style={{ color: "#3d4f60" }}>
          Based on delivered diagnostics. Tier tracking column coming in next schema update.
        </p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue",      value: fmtEur(totalRevenue),  color: "#c8a84b" },
          { label: "Delivered",          value: String(delivered.length), color: "#2ecc71" },
          { label: "Pipeline (active)",  value: String(pipelineCount), color: "#2d9cdb" },
          { label: "Pipeline Value",     value: fmtEur(pipelineValue), color: "#e0a832" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl p-4"
            style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#3d4f60" }}>
              {m.label}
            </p>
            <p className="text-2xl font-bold" style={{ color: m.color }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Monthly breakdown */}
      {months.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#2d9cdb" }}>
            Monthly Breakdown
          </h3>
          <div className="space-y-3">
            {months.map(([key, data]) => {
              const maxRevenue = Math.max(...months.map(([, d]) => d.revenue), 1);
              const barWidth   = Math.round((data.revenue / maxRevenue) * 100);
              return (
                <div key={key} className="flex items-center gap-4">
                  <span className="text-sm w-32 shrink-0" style={{ color: "#8899aa" }}>
                    {monthLabel(key)}
                  </span>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: "6px", background: "rgba(255,255,255,0.06)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${barWidth}%`, background: "#c8a84b" }}
                      />
                    </div>
                    <span className="text-sm font-medium w-20 text-right shrink-0" style={{ color: "#c8a84b" }}>
                      {fmtEur(data.revenue)}
                    </span>
                    <span className="text-xs w-16 shrink-0" style={{ color: "#3d4f60" }}>
                      {data.count} report{data.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delivered diagnostics table */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "#8899aa" }}>
          Delivered Reports
        </h3>
        <DataTable headers={["Company", "AI System", "Delivered", "Tier", "Value", "Status"]}>
          {delivered.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "#3d4f60" }}>
                No delivered diagnostics yet.
              </td>
            </tr>
          ) : (
            delivered.map((d: { id: string; status: string; created_at: string; ai_systems: unknown }) => {
              const sys = Array.isArray(d.ai_systems) ? (d.ai_systems as { name?: string; companies?: unknown }[])[0] : d.ai_systems as { name?: string; companies?: unknown } | null;
              const company = sys?.companies
                ? Array.isArray(sys.companies) ? sys.companies[0] : sys.companies
                : null;
              const price = getTierPrice(defaultTier);

              return (
                <TableRow key={d.id}>
                  <TableCell>{(company as { name?: string } | null)?.name ?? "—"}</TableCell>
                  <TableCell muted>{sys?.name ?? "—"}</TableCell>
                  <TableCell muted>{fmtDate(d.created_at)}</TableCell>
                  <TableCell>
                    <span
                      className="text-xs px-2 py-0.5 rounded capitalize"
                      style={{
                        background: "rgba(200,168,75,0.1)",
                        color: "#c8a84b",
                        border: "1px solid rgba(200,168,75,0.2)",
                      }}
                    >
                      {defaultTier}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span style={{ color: "#c8a84b" }}>{fmtEur(price)}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={d.status} />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </DataTable>
      </div>
    </div>
  );
}
