import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

const IMPACT_STYLES = {
  high:   { bg: "rgba(224,82,82,0.1)",   color: "#e05252", border: "rgba(224,82,82,0.25)"   },
  medium: { bg: "rgba(224,168,50,0.1)",  color: "#e0a832", border: "rgba(224,168,50,0.25)"  },
  low:    { bg: "rgba(45,156,219,0.08)", color: "#2d9cdb", border: "rgba(45,156,219,0.2)"   },
} as const;

export default async function RegulatoryFeedSection() {
  const adminClient = createSupabaseAdminClient();

  const { data } = await adminClient
    .from("regulatory_intel")
    .select("id, title, change_summary, impact_level, affected_obligations, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  const items = data ?? [];
  if (items.length === 0) return null;

  return (
    <section className="py-20 px-6" style={{ background: "#080c14" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <div
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full mb-4"
              style={{ background: "rgba(45,156,219,0.1)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.2)" }}
            >
              Live Intelligence
            </div>
            <h2
              className="text-2xl font-semibold"
              style={{ fontFamily: "var(--font-playfair, serif)", color: "#e8f4ff" }}
            >
              Latest EU AI Act Developments
            </h2>
            <p className="text-sm mt-1" style={{ color: "#3d4f60" }}>
              Monitored from official EU sources and analysed by our team
            </p>
          </div>
          <Link
            href="/regulatory-updates"
            className="text-xs font-medium shrink-0"
            style={{ color: "#2d9cdb" }}
          >
            View all →
          </Link>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {items.map((item: any) => {
            const lvl   = (item.impact_level ?? "low") as keyof typeof IMPACT_STYLES;
            const style = IMPACT_STYLES[lvl] ?? IMPACT_STYLES.low;

            return (
              <div
                key={item.id}
                className="rounded-xl p-5"
                style={{ background: "#0d1520", border: `1px solid ${style.border}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
                      >
                        {lvl.charAt(0).toUpperCase() + lvl.slice(1)} Impact
                      </span>
                      {item.affected_obligations?.slice(0, 2).map((ob: string) => (
                        <span
                          key={ob}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ background: "rgba(255,255,255,0.04)", color: "#3d4f60", border: "1px solid rgba(255,255,255,0.08)" }}
                        >
                          {ob.split("(")[0].trim()}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm font-semibold mb-1" style={{ color: "#e8f4ff" }}>
                      {item.title}
                    </p>
                    {item.change_summary && (
                      <p
                        className="text-xs leading-relaxed"
                        style={{
                          color: "#8899aa",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        } as React.CSSProperties}
                      >
                        {item.change_summary}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/regulatory-updates"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg"
            style={{
              background: "rgba(45,156,219,0.08)",
              color: "#2d9cdb",
              border: "1px solid rgba(45,156,219,0.2)",
            }}
          >
            View full intelligence feed →
          </Link>
        </div>
      </div>
    </section>
  );
}
