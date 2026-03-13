import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { FetchIntelButton } from "@/components/admin/FetchIntelButton";
import { ExternalLink, AlertTriangle, Info, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Regulatory Intel — LexSutra Admin" };

const IMPACT_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  high:   { bg: "rgba(224,82,82,0.1)",   color: "#e05252", border: "rgba(224,82,82,0.3)",   label: "High Impact"   },
  medium: { bg: "rgba(224,168,50,0.1)",  color: "#e0a832", border: "rgba(224,168,50,0.3)",  label: "Medium Impact" },
  low:    { bg: "rgba(45,156,219,0.08)", color: "#2d9cdb", border: "rgba(45,156,219,0.25)", label: "Low Impact"    },
};

const IMPACT_ICON = {
  high:   AlertTriangle,
  medium: TrendingUp,
  low:    Info,
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

type IntelRow = {
  id: string;
  title: string;
  source_name: string;
  source_url: string;
  published_at: string | null;
  fetched_at: string;
  change_summary: string | null;
  affected_obligations: string[] | null;
  impact_level: string | null;
  example_impact: string | null;
  created_at: string;
};

export default async function RegulatoryIntelPage({
  searchParams,
}: {
  searchParams: Promise<{ impact?: string; obligation?: string }>;
}) {
  const { impact, obligation } = await searchParams;
  const adminClient = createSupabaseAdminClient();

  let query = adminClient
    .from("regulatory_intel")
    .select("id, title, source_name, source_url, published_at, fetched_at, change_summary, affected_obligations, impact_level, example_impact, created_at")
    .order("created_at", { ascending: false });

  if (impact && impact !== "all") {
    query = query.eq("impact_level", impact);
  }

  const { data: rows, error } = await query;

  if (error) console.error("[regulatory-intel] query error:", error.message);

  const intel = (rows ?? []) as IntelRow[];

  // Filter by obligation client-side (it's an array column)
  const filtered = obligation && obligation !== "all"
    ? intel.filter((r) => r.affected_obligations?.includes(obligation))
    : intel;

  // Collect all unique obligations for the filter
  const allObligations = Array.from(
    new Set(intel.flatMap((r) => r.affected_obligations ?? []))
  ).sort();

  const highCount   = intel.filter((r) => r.impact_level === "high").length;
  const mediumCount = intel.filter((r) => r.impact_level === "medium").length;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
          >
            Regulatory Intelligence
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "#3d4f60" }}>
            EU AI Act official developments — fetched and analysed by Claude
          </p>
        </div>
        <FetchIntelButton />
      </div>

      {/* Summary stats */}
      {intel.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total items",     value: intel.length,  color: "#e8f4ff" },
            { label: "High impact",     value: highCount,     color: "#e05252" },
            { label: "Medium impact",   value: mediumCount,   color: "#e0a832" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-4 py-3"
              style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "#3d4f60" }}>
                {s.label}
              </p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {intel.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {/* Impact filter */}
          {(["all", "high", "medium", "low"] as const).map((lvl) => {
            const isActive = (impact ?? "all") === lvl;
            const style    = lvl !== "all" ? IMPACT_STYLES[lvl] : null;
            return (
              <a
                key={lvl}
                href={`/admin/regulatory-intel?impact=${lvl}${obligation ? `&obligation=${obligation}` : ""}`}
                className="text-xs px-3 py-1.5 rounded-lg font-medium capitalize"
                style={isActive && style
                  ? { background: style.bg, color: style.color, border: `1px solid ${style.border}` }
                  : isActive
                  ? { background: "rgba(45,156,219,0.12)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.25)" }
                  : { background: "rgba(255,255,255,0.04)", color: "#3d4f60", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                {lvl === "all" ? "All impacts" : lvl}
              </a>
            );
          })}

          {/* Obligation filter */}
          {allObligations.length > 0 && (
            <>
              <span className="text-xs self-center" style={{ color: "#3d4f60" }}>·</span>
              <a
                href={`/admin/regulatory-intel?impact=${impact ?? "all"}`}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={!obligation || obligation === "all"
                  ? { background: "rgba(45,156,219,0.12)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.25)" }
                  : { background: "rgba(255,255,255,0.04)", color: "#3d4f60", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                All obligations
              </a>
              {allObligations.map((ob) => (
                <a
                  key={ob}
                  href={`/admin/regulatory-intel?impact=${impact ?? "all"}&obligation=${encodeURIComponent(ob)}`}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={obligation === ob
                    ? { background: "rgba(200,168,75,0.12)", color: "#c8a84b", border: "1px solid rgba(200,168,75,0.25)" }
                    : { background: "rgba(255,255,255,0.04)", color: "#3d4f60", border: "1px solid rgba(255,255,255,0.08)" }
                  }
                >
                  {ob.split("(")[0].trim()}
                </a>
              ))}
            </>
          )}
        </div>
      )}

      {/* Intel cards */}
      {filtered.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center space-y-3"
          style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-sm font-medium" style={{ color: "#e8f4ff" }}>No regulatory intel yet</p>
          <p className="text-xs" style={{ color: "#3d4f60" }}>
            Click "Fetch Latest" to pull the latest EU AI Act developments from official sources.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const lvl     = (item.impact_level ?? "low") as "high" | "medium" | "low";
            const style   = IMPACT_STYLES[lvl] ?? IMPACT_STYLES.low;
            const Icon    = IMPACT_ICON[lvl] ?? Info;

            return (
              <div
                key={item.id}
                className="rounded-xl p-5 space-y-4"
                style={{ background: "#0d1520", border: `1px solid ${style.border}` }}
              >
                {/* Title row */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: style.bg }}
                  >
                    <Icon size={15} color={style.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="text-sm font-semibold flex-1" style={{ color: "#e8f4ff" }}>
                        {item.title}
                      </p>
                      <span
                        className="text-xs px-2 py-0.5 rounded font-medium shrink-0"
                        style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
                      >
                        {style.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 hover:underline"
                        style={{ color: "#2d9cdb" }}
                      >
                        {item.source_name} <ExternalLink size={10} />
                      </a>
                      <span className="text-xs" style={{ color: "#3d4f60" }}>
                        {item.published_at
                          ? `Published ${fmtDate(item.published_at)}`
                          : `Fetched ${fmtDate(item.fetched_at)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {item.change_summary && (
                  <p className="text-sm leading-relaxed" style={{ color: "#8899aa" }}>
                    {item.change_summary}
                  </p>
                )}

                {/* Example impact */}
                {item.example_impact && (
                  <div
                    className="rounded-lg px-4 py-3"
                    style={{
                      background: "rgba(200,168,75,0.05)",
                      border:     "1px solid rgba(200,168,75,0.15)",
                    }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#c8a84b" }}>
                      What this means for your clients
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "#8899aa" }}>
                      {item.example_impact}
                    </p>
                  </div>
                )}

                {/* Affected obligations */}
                {item.affected_obligations && item.affected_obligations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.affected_obligations.map((ob) => (
                      <span
                        key={ob}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: "rgba(45,156,219,0.08)",
                          color:      "#2d9cdb",
                          border:     "1px solid rgba(45,156,219,0.15)",
                        }}
                      >
                        {ob}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
