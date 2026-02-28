import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { PaginationControls } from "@/components/admin/PaginationControls";

export const metadata = { title: "Error Logs — LexSutra Admin" };

const SEVERITY_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  error:   { label: "Error",   color: "#e05252", bg: "rgba(224,82,82,0.1)",   border: "rgba(224,82,82,0.25)"   },
  warning: { label: "Warning", color: "#e0a832", bg: "rgba(224,168,50,0.1)",  border: "rgba(224,168,50,0.25)"  },
  info:    { label: "Info",    color: "#2d9cdb", bg: "rgba(45,156,219,0.1)",  border: "rgba(45,156,219,0.25)"  },
};

const PAGE_SIZE = 30;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default async function ErrorLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; severity?: string }>;
}) {
  const { page: pageStr, severity: severityFilter } = await searchParams;
  const page   = Math.max(1, parseInt(pageStr ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const adminClient = createSupabaseAdminClient();

  let query = adminClient
    .from("error_logs")
    .select(`
      id, created_at, severity, source, action,
      error_message, stack_trace, metadata,
      actor_id, company_id,
      companies:company_id ( name )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (severityFilter && ["error", "warning", "info"].includes(severityFilter)) {
    query = query.eq("severity", severityFilter);
  }

  const { data: logs, count } = await query;

  const rows      = logs ?? [];
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
          >
            Error Logs
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#3d4f60" }}>
            {count ?? 0} total entries
          </p>
        </div>

        {/* Severity filter */}
        <div className="flex items-center gap-2">
          {[undefined, "error", "warning", "info"].map((s) => (
            <a
              key={s ?? "all"}
              href={s ? `?severity=${s}` : "?"}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={
                (s ?? undefined) === (severityFilter ?? undefined)
                  ? { background: "rgba(45,156,219,0.15)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.3)" }
                  : { background: "rgba(255,255,255,0.04)", color: "#8899aa", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
            </a>
          ))}
        </div>
      </div>

      {/* Error list */}
      {rows.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-sm" style={{ color: "#2ecc71" }}>
            ✓ No errors logged{severityFilter ? ` at ${severityFilter} level` : ""}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((log: {
            id: string;
            created_at: string;
            severity: string;
            source: string;
            action: string;
            error_message: string;
            stack_trace: string | null;
            metadata: Record<string, unknown>;
            actor_id: string | null;
            company_id: string | null;
            companies: { name: string } | { name: string }[] | null;
          }) => {
            const sev     = SEVERITY_META[log.severity] ?? SEVERITY_META.error;
            const company = Array.isArray(log.companies) ? log.companies[0] : log.companies;

            return (
              <div
                key={log.id}
                className="rounded-xl p-5 space-y-3"
                style={{ background: "#0d1520", border: `1px solid ${sev.border}` }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}
                    >
                      {sev.label}
                    </span>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ background: "rgba(255,255,255,0.04)", color: "#2d9cdb" }}
                    >
                      {log.source}
                    </span>
                    <span className="text-xs" style={{ color: "#8899aa" }}>›</span>
                    <span
                      className="text-xs font-mono"
                      style={{ color: "#8899aa" }}
                    >
                      {log.action}
                    </span>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: "#3d4f60" }}>
                    {fmtDate(log.created_at)}
                  </span>
                </div>

                {/* Error message */}
                <p
                  className="text-sm font-medium"
                  style={{ color: sev.color }}
                >
                  {log.error_message}
                </p>

                {/* Context row */}
                <div className="flex flex-wrap gap-4">
                  {company?.name && (
                    <ContextTag label="Company" value={company.name} />
                  )}
                  {log.actor_id && (
                    <ContextTag label="User" value={log.actor_id.slice(0, 8) + "…"} mono />
                  )}
                  {Object.keys(log.metadata ?? {}).length > 0 && (
                    <ContextTag
                      label="Context"
                      value={JSON.stringify(log.metadata).slice(0, 120) + (JSON.stringify(log.metadata).length > 120 ? "…" : "")}
                      mono
                    />
                  )}
                </div>

                {/* Stack trace (collapsed) */}
                {log.stack_trace && (
                  <details className="mt-1">
                    <summary
                      className="text-xs cursor-pointer"
                      style={{ color: "#3d4f60" }}
                    >
                      Stack trace
                    </summary>
                    <pre
                      className="text-xs mt-2 p-3 rounded-lg overflow-x-auto"
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        color: "#8899aa",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      {log.stack_trace}
                    </pre>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <PaginationControls currentPage={page} totalPages={totalPages} baseHref="/admin/errors" />
      )}
    </div>
  );
}

function ContextTag({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs" style={{ color: "#3d4f60" }}>{label}:</span>
      <span
        className="text-xs"
        style={{ color: "#8899aa", fontFamily: mono ? "monospace" : undefined, fontSize: mono ? "11px" : undefined }}
      >
        {value}
      </span>
    </div>
  );
}
