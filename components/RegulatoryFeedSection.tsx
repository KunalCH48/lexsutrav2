import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

const IMPACT_STYLES = {
  high:   { color: "#e05252", border: "#e05252", label: "High Impact",   dot: "rgba(224,82,82,0.9)"   },
  medium: { color: "#e0a832", border: "#e0a832", label: "Medium Impact", dot: "rgba(224,168,50,0.9)"  },
  low:    { color: "#2d9cdb", border: "#2d9cdb", label: "Low Impact",    dot: "rgba(45,156,219,0.9)"  },
} as const;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

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
    <section
      className="py-24 px-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #060a14 0%, #0a1628 50%, #060a14 100%)",
        borderTop:    "1px solid rgba(45,156,219,0.15)",
        borderBottom: "1px solid rgba(45,156,219,0.15)",
      }}
    >
      {/* Subtle glow accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(45,156,219,0.5), transparent)" }}
      />

      <div className="max-w-4xl mx-auto relative">

        {/* Header */}
        <div className="text-center mb-12">
          {/* Live pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{
              background: "rgba(224,82,82,0.08)",
              border: "1px solid rgba(224,82,82,0.3)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: "#e05252",
                boxShadow: "0 0 6px rgba(224,82,82,0.8)",
                animation: "pulse 2s infinite",
              }}
            />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#e05252" }}>
              Live — EU AI Act Intelligence
            </span>
          </div>

          <h2
            className="text-3xl sm:text-4xl font-semibold mb-3"
            style={{ fontFamily: "var(--font-playfair, serif)", color: "#e8f4ff" }}
          >
            The law is moving.<br />
            <span style={{ color: "#2d9cdb" }}>Is your AI system keeping up?</span>
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "#8899aa" }}>
            We monitor official EU sources continuously and flag what matters for high-risk AI companies.
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-3 mb-10">
          {items.map((item: any) => {
            const lvl   = (item.impact_level ?? "low") as keyof typeof IMPACT_STYLES;
            const style = IMPACT_STYLES[lvl] ?? IMPACT_STYLES.low;

            return (
              <div
                key={item.id}
                className="rounded-xl p-5 flex items-start gap-4"
                style={{
                  background:  "rgba(13,21,32,0.8)",
                  border:      "1px solid rgba(255,255,255,0.07)",
                  borderLeft:  `3px solid ${style.border}`,
                }}
              >
                {/* Dot */}
                <div className="mt-1 shrink-0">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: style.dot, boxShadow: `0 0 6px ${style.dot}` }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: style.color }}>
                      {style.label}
                    </span>
                    <span className="text-xs" style={{ color: "#3d4f60" }}>·</span>
                    <span className="text-xs" style={{ color: "#3d4f60" }}>{fmtDate(item.created_at)}</span>
                    {item.affected_obligations?.slice(0, 2).map((ob: string) => (
                      <span
                        key={ob}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: "rgba(255,255,255,0.04)", color: "#5a6a7a", border: "1px solid rgba(255,255,255,0.07)" }}
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
            );
          })}
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-center sm:text-left" style={{ color: "#3d4f60" }}>
            August 2, 2026 — high-risk AI compliance deadline
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/regulatory-updates"
              className="text-xs font-medium px-4 py-2 rounded-lg"
              style={{
                background: "rgba(45,156,219,0.08)",
                color: "#2d9cdb",
                border: "1px solid rgba(45,156,219,0.2)",
              }}
            >
              Full intelligence feed →
            </Link>
            <Link
              href="/#demo"
              className="text-xs font-medium px-4 py-2 rounded-lg"
              style={{ background: "#2d9cdb", color: "#fff" }}
            >
              Check your exposure →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
