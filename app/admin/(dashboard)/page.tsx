import { createSupabaseAdminClient } from "@/lib/supabase-server";
import Link from "next/link";

export const metadata = { title: "Overview — LexSutra Admin" };

async function getStats() {
  const supabase = createSupabaseAdminClient();

  const [demoRes, diagnosticsRes, companiesRes, recentDemosRes, activeDiagnosticsRes] =
    await Promise.all([
      supabase
        .from("demo_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("diagnostics")
        .select("*", { count: "exact", head: true })
        .in("status", ["draft", "in_review"]),
      supabase
        .from("companies")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("demo_requests")
        .select("id, company_name, email, website_url, status, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("diagnostics")
        .select("id, status, created_at, companies(name), ai_systems(name)")
        .in("status", ["draft", "in_review"])
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return {
    pendingDemos: demoRes.count ?? 0,
    activeDiagnostics: diagnosticsRes.count ?? 0,
    totalClients: companiesRes.count ?? 0,
    recentDemos: recentDemosRes.data ?? [],
    activeDiagnosticsList: activeDiagnosticsRes.data ?? [],
  };
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return "Just now";
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: "rgba(224,168,50,0.15)",  color: "#e0a832", label: "Pending" },
  contacted: { bg: "rgba(45,156,219,0.15)",  color: "#2d9cdb", label: "Contacted" },
  converted: { bg: "rgba(46,204,113,0.15)",  color: "#2ecc71", label: "Converted" },
  rejected:  { bg: "rgba(224,82,82,0.15)",   color: "#e05252", label: "Rejected" },
  draft:     { bg: "rgba(224,168,50,0.15)",  color: "#e0a832", label: "Draft" },
  in_review: { bg: "rgba(45,156,219,0.15)",  color: "#2d9cdb", label: "In Review" },
  delivered: { bg: "rgba(46,204,113,0.15)",  color: "#2ecc71", label: "Delivered" },
};

export default async function AdminOverviewPage() {
  const stats = await getStats();

  const metrics = [
    { label: "Demo Queue", value: stats.pendingDemos, color: "#e0a832", sub: "Awaiting review" },
    { label: "Active Diagnostics", value: stats.activeDiagnostics, color: "#2d9cdb", sub: "In progress" },
    { label: "Total Clients", value: stats.totalClients, color: "#2ecc71", sub: "All time" },
    { label: "Revenue (Feb)", value: "€0", color: "#c8a84b", sub: "0 diagnostics delivered" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-3xl font-light text-white">
            Admin <em className="italic" style={{ color: "#2d9cdb" }}>Overview</em>
          </h2>
        </div>
        <span className="text-xs" style={{ color: "rgba(232,244,255,0.4)" }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · All systems operational
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg p-6"
            style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
          >
            <p className="text-xs font-medium tracking-widest uppercase mb-3" style={{ color: "rgba(232,244,255,0.5)" }}>
              {m.label}
            </p>
            <p className="font-serif text-4xl font-bold leading-none mb-1" style={{ color: m.color }}>
              {m.value}
            </p>
            <p className="text-xs" style={{ color: "rgba(232,244,255,0.4)" }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Demo Queue table */}
      <div
        className="rounded-lg overflow-hidden mb-6"
        style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(45,156,219,0.15)" }}
        >
          <h3 className="text-sm font-medium text-white">Demo Snapshot Queue — Awaiting Review</h3>
          <span className="text-xs" style={{ color: "rgba(232,244,255,0.4)" }}>
            {stats.pendingDemos} pending · Target: review within 12hrs
          </span>
        </div>

        {/* Table header */}
        <div
          className="grid text-xs font-medium tracking-wider uppercase px-5 py-3"
          style={{
            gridTemplateColumns: "2fr 1fr 1fr 1fr 120px",
            color: "rgba(232,244,255,0.4)",
            background: "rgba(232,244,255,0.03)",
            borderBottom: "1px solid rgba(45,156,219,0.15)",
          }}
        >
          <div>Company</div>
          <div>Email</div>
          <div>Submitted</div>
          <div>Status</div>
          <div>Action</div>
        </div>

        {stats.recentDemos.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: "rgba(232,244,255,0.3)" }}>
            No demo requests yet.
          </div>
        ) : (
          stats.recentDemos.map((r: any) => {
            const s = STATUS_COLORS[r.status] ?? STATUS_COLORS.pending;
            return (
              <div
                key={r.id}
                className="grid items-center px-5 py-3.5 text-sm transition-colors"
                style={{
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 120px",
                  borderBottom: "1px solid rgba(45,156,219,0.08)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,244,255,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <div className="font-medium text-white">{r.company_name}</div>
                  {r.website_url && (
                    <div className="text-xs mt-0.5" style={{ color: "rgba(232,244,255,0.4)" }}>
                      {r.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </div>
                  )}
                </div>
                <div className="text-xs" style={{ color: "rgba(232,244,255,0.5)" }}>{r.email}</div>
                <div className="text-xs" style={{ color: "rgba(232,244,255,0.5)" }}>{timeAgo(r.created_at)}</div>
                <div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.label}
                  </span>
                </div>
                <div>
                  <Link
                    href="/admin/demo-requests"
                    className="px-3 py-1.5 rounded text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ background: "#2d9cdb", color: "#fff" }}
                  >
                    Review →
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Diagnostic Queue table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(45,156,219,0.15)" }}
        >
          <h3 className="text-sm font-medium text-white">Diagnostic Queue — In Progress</h3>
          <span className="text-xs" style={{ color: "rgba(232,244,255,0.4)" }}>
            {stats.activeDiagnostics} active · Target: 48-72hrs delivery
          </span>
        </div>

        <div
          className="grid text-xs font-medium tracking-wider uppercase px-5 py-3"
          style={{
            gridTemplateColumns: "2fr 1fr 1fr 1fr 120px",
            color: "rgba(232,244,255,0.4)",
            background: "rgba(232,244,255,0.03)",
            borderBottom: "1px solid rgba(45,156,219,0.15)",
          }}
        >
          <div>Client</div>
          <div>AI System</div>
          <div>Requested</div>
          <div>Progress</div>
          <div>Action</div>
        </div>

        {stats.activeDiagnosticsList.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: "rgba(232,244,255,0.3)" }}>
            No active diagnostics.
          </div>
        ) : (
          stats.activeDiagnosticsList.map((d: any) => {
            const s = STATUS_COLORS[d.status] ?? STATUS_COLORS.draft;
            const progress = d.status === "in_review" ? 80 : 40;
            return (
              <div
                key={d.id}
                className="grid items-center px-5 py-3.5 text-sm"
                style={{
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 120px",
                  borderBottom: "1px solid rgba(45,156,219,0.08)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,244,255,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <div className="font-medium text-white">
                    {(d.companies as any)?.name ?? "Unknown"}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(232,244,255,0.4)" }}>
                    {s.label}
                  </div>
                </div>
                <div className="text-xs" style={{ color: "rgba(232,244,255,0.5)" }}>
                  {(d.ai_systems as any)?.name ?? "—"}
                </div>
                <div className="text-xs" style={{ color: "rgba(232,244,255,0.5)" }}>
                  {timeAgo(d.created_at)}
                </div>
                <div>
                  <div
                    className="rounded-full h-1.5 w-24 mb-1"
                    style={{ background: "#111d2e" }}
                  >
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${progress}%`, background: "#2d9cdb" }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: "rgba(232,244,255,0.4)" }}>
                    {progress}% — {d.status === "in_review" ? "Awaiting review" : "In progress"}
                  </span>
                </div>
                <div>
                  <Link
                    href="/admin/diagnostics"
                    className="px-3 py-1.5 rounded text-xs font-medium transition-opacity hover:opacity-80"
                    style={{ background: "#2d9cdb", color: "#fff" }}
                  >
                    Review →
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
