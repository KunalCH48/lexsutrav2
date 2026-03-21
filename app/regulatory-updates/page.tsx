import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { ExternalLink, AlertTriangle, Info, TrendingUp } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "EU AI Act Regulatory Intelligence — LexSutra",
  description: "Latest EU AI Act developments, guidance, and compliance deadlines — monitored and analysed by LexSutra.",
};

const IMPACT_STYLES = {
  high:   { bg: "rgba(224,82,82,0.1)",   color: "#e05252", border: "rgba(224,82,82,0.3)",   label: "High Impact"   },
  medium: { bg: "rgba(224,168,50,0.1)",  color: "#e0a832", border: "rgba(224,168,50,0.3)",  label: "Medium Impact" },
  low:    { bg: "rgba(45,156,219,0.08)", color: "#2d9cdb", border: "rgba(45,156,219,0.25)", label: "Low Impact"    },
} as const;

const IMPACT_ICON = {
  high:   AlertTriangle,
  medium: TrendingUp,
  low:    Info,
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export default async function RegulatoryUpdatesPage() {
  const adminClient = createSupabaseAdminClient();

  const { data: rows } = await adminClient
    .from("regulatory_intel")
    .select("id, title, source_name, source_url, published_at, fetched_at, change_summary, affected_obligations, impact_level, example_impact, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const items = rows ?? [];

  return (
    <div style={{ background: "#080c14", minHeight: "100vh" }}>
      {/* Nav */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: "rgba(45,156,219,0.15)" }}
      >
        <Link href="/" className="flex items-center gap-1">
          <span className="text-lg font-serif font-bold" style={{ color: "#2d9cdb" }}>Lex</span>
          <span className="text-lg font-serif font-bold text-white">Sutra</span>
        </Link>
        <Link
          href="/"
          className="text-xs"
          style={{ color: "#3d4f60" }}
        >
          ← Back to home
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        {/* Header */}
        <div>
          <div
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full mb-4"
            style={{ background: "rgba(45,156,219,0.1)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.2)" }}
          >
            Live Intelligence Feed
          </div>
          <h1
            className="text-3xl font-semibold mb-3"
            style={{ fontFamily: "var(--font-playfair, serif)", color: "#e8f4ff" }}
          >
            EU AI Act Regulatory Intelligence
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#8899aa" }}>
            Official EU AI Act developments, guidance documents, and compliance milestones —
            monitored and analysed by the LexSutra team.
          </p>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{ background: "#0d1520", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: "#e8f4ff" }}>No updates published yet</p>
            <p className="text-xs" style={{ color: "#3d4f60" }}>Check back soon — we monitor official EU sources continuously.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((item: any) => {
              const lvl   = (item.impact_level ?? "low") as keyof typeof IMPACT_STYLES;
              const style = IMPACT_STYLES[lvl] ?? IMPACT_STYLES.low;
              const Icon  = IMPACT_ICON[lvl] ?? Info;

              return (
                <div
                  key={item.id}
                  className="rounded-xl p-6 space-y-4"
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
                            : `Added ${fmtDate(item.fetched_at)}`}
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
                      style={{ background: "rgba(200,168,75,0.05)", border: "1px solid rgba(200,168,75,0.15)" }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#c8a84b" }}>
                        What this means for AI companies
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: "#8899aa" }}>
                        {item.example_impact}
                      </p>
                    </div>
                  )}

                  {/* Obligations */}
                  {item.affected_obligations && item.affected_obligations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.affected_obligations.map((ob: string) => (
                        <span
                          key={ob}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ background: "rgba(45,156,219,0.08)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.15)" }}
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

        {/* CTA */}
        <div
          className="rounded-xl p-8 text-center space-y-4"
          style={{ background: "#0d1520", border: "1px solid rgba(200,168,75,0.2)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#c8a84b" }}>
            Is your AI system ready for the August 2026 deadline?
          </p>
          <p className="text-xs" style={{ color: "#8899aa" }}>
            LexSutra provides a full EU AI Act compliance diagnostic — graded report, legal citations, remediation roadmap.
          </p>
          <Link
            href="/#demo"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "#2d9cdb", color: "#fff" }}
          >
            Get your free diagnostic preview →
          </Link>
        </div>
      </div>
    </div>
  );
}
