import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LoginAsButton } from "@/components/admin/LoginAsButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client Detail — LexSutra Admin" };

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ragColor(rag: string) {
  if (rag === "green")  return "#2ecc71";
  if (rag === "amber")  return "#e0a832";
  if (rag === "red")    return "#e05252";
  return "#8899aa";
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminClient = createSupabaseAdminClient();

  const [companyRes, demoRes, activityRes] = await Promise.all([
    adminClient
      .from("companies")
      .select(`
        id, name, contact_email, website_url, created_at,
        ai_systems (
          id, name, risk_category, description,
          diagnostics (
            id, status, created_at,
            diagnostic_findings ( rag_status, score )
          )
        ),
        documents ( id, file_name, file_size, file_type, confirmed_at, created_at )
      `)
      .eq("id", id)
      .single(),

    // Demo request matched by contact_email
    adminClient
      .from("demo_requests")
      .select("id, status, created_at, company_name, contact_email")
      .order("created_at", { ascending: false }),

    adminClient
      .from("activity_log")
      .select("id, action, entity_type, entity_id, created_at, metadata")
      .or(`entity_id.eq.${id},metadata->>company_id.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (companyRes.error || !companyRes.data) notFound();

  const company  = companyRes.data;
  const aiSystems = company.ai_systems ?? [];
  const documents = company.documents ?? [];
  const activity  = activityRes.data ?? [];

  // Find matching demo request by email (most reliable key)
  const allDemos   = demoRes.data ?? [];
  const demoRequest = allDemos.find(
    (d: { id: string; status: string; created_at: string; company_name: string; contact_email: string }) =>
      d.contact_email?.toLowerCase() === company.contact_email?.toLowerCase()
  ) ?? null;

  // Get the profile/userId for this company's client account
  const { data: clientProfile } = await adminClient
    .from("profiles")
    .select("id, display_name, role")
    .eq("company_id", id)
    .eq("role", "client")
    .single();

  // Get reviewer sign-offs for any diagnostic in this company
  const allDiagnosticIds = aiSystems.flatMap((s: any) =>
    (s.diagnostics ?? []).map((d: any) => d.id)
  );

  let approvals: any[] = [];
  if (allDiagnosticIds.length > 0) {
    const { data } = await adminClient
      .from("report_approvals")
      .select("id, diagnostic_id, reviewer_name, credential, approved_at")
      .in("diagnostic_id", allDiagnosticIds)
      .not("approved_at", "is", null)
      .order("approved_at", { ascending: false });
    approvals = data ?? [];
  }

  // Stats
  const allDiags  = aiSystems.flatMap((s: any) => s.diagnostics ?? []);
  const allFindings = allDiags.flatMap((d: any) => d.diagnostic_findings ?? []);
  const criticals = allFindings.filter((f: any) => f.rag_status === "red").length;
  const confirmedDocs = documents.filter((d: any) => d.confirmed_at).length;

  const latestDiag = [...allDiags].sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0] ?? null;

  function formatBytes(bytes: number) {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="max-w-5xl">
      {/* Back */}
      <Link href="/admin/clients" className="gold-link text-sm flex items-center gap-1.5 mb-6 w-fit">
        ← Back to Clients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h2
            className="text-2xl font-semibold mb-1"
            style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
          >
            {company.name}
          </h2>
          <p className="text-sm" style={{ color: "#8899aa" }}>
            {company.contact_email}
            {company.website_url && (
              <>
                {" · "}
                <a
                  href={company.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gold-link"
                >
                  {company.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </>
            )}
          </p>
          <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>
            Client since {fmtDate(company.created_at)}
          </p>
        </div>

        {/* Login As */}
        {clientProfile?.id ? (
          <LoginAsButton userId={clientProfile.id} label="Login As Client" />
        ) : (
          <span className="text-xs px-3 py-1.5 rounded-lg" style={{ color: "#3d4f60", border: "1px solid rgba(255,255,255,0.06)" }}>
            No portal account
          </span>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "AI Systems",    value: aiSystems.length },
          { label: "Diagnostics",   value: allDiags.length },
          { label: "Critical Gaps", value: criticals,       color: criticals > 0 ? "#e05252" : undefined },
          { label: "Documents",     value: `${confirmedDocs}/${documents.length}` },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-4"
            style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.12)" }}
          >
            <p className="text-xs mb-1" style={{ color: "#3d4f60" }}>{label}</p>
            <p className="text-2xl font-semibold" style={{ color: color ?? "#e8f4ff" }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">

          {/* AI Systems + Diagnostics */}
          <Section title="AI Systems & Diagnostics">
            {aiSystems.length === 0 ? (
              <Empty>No AI systems registered.</Empty>
            ) : (
              aiSystems.map((sys: any) => {
                const diags = [...(sys.diagnostics ?? [])].sort(
                  (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                return (
                  <div
                    key={sys.id}
                    className="mb-4 last:mb-0 pb-4 last:pb-0"
                    style={{ borderBottom: "1px solid rgba(45,156,219,0.08)" }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#e8f4ff" }}>{sys.name}</p>
                        {sys.risk_category && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block"
                            style={{ background: "rgba(255,255,255,0.05)", color: "#8899aa", border: "1px solid rgba(255,255,255,0.08)" }}
                          >
                            {sys.risk_category}
                          </span>
                        )}
                      </div>
                    </div>

                    {diags.length === 0 ? (
                      <p className="text-xs" style={{ color: "#3d4f60" }}>No diagnostics yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {diags.map((d: any) => {
                          const findings  = d.diagnostic_findings ?? [];
                          const crits     = findings.filter((f: any) => f.rag_status === "red").length;
                          const approval  = approvals.find((a: any) => a.diagnostic_id === d.id);
                          return (
                            <div
                              key={d.id}
                              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(45,156,219,0.06)" }}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <StatusBadge status={d.status} />
                                <span className="text-xs" style={{ color: "#3d4f60" }}>{fmtDate(d.created_at)}</span>
                                {crits > 0 && (
                                  <span className="text-xs px-1.5 rounded" style={{ background: "rgba(224,82,82,0.1)", color: "#e05252" }}>
                                    {crits} critical
                                  </span>
                                )}
                                {approval && (
                                  <span className="text-xs" style={{ color: "#2ecc71" }} title={`Signed by ${approval.reviewer_name}`}>✓ signed</span>
                                )}
                              </div>
                              <Link
                                href={`/admin/diagnostics/${d.id}`}
                                className="text-xs shrink-0"
                                style={{ color: "#2d9cdb" }}
                              >
                                Review →
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </Section>

          {/* Demo Request */}
          <Section title="Demo Request">
            {demoRequest ? (
              <div className="flex items-center justify-between">
                <div>
                  <StatusBadge status={demoRequest.status} />
                  <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>Submitted {fmtDate(demoRequest.created_at)}</p>
                </div>
                <Link
                  href={`/admin/demo-requests/${demoRequest.id}`}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(45,156,219,0.12)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.25)" }}
                >
                  View →
                </Link>
              </div>
            ) : (
              <Empty>No demo request linked.</Empty>
            )}
          </Section>

          {/* Reviewer Sign-offs */}
          {approvals.length > 0 && (
            <Section title="Reviewer Sign-offs">
              <div className="space-y-2">
                {approvals.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: "#e8f4ff" }}>{a.reviewer_name}</p>
                      {a.credential && (
                        <p className="text-xs" style={{ color: "#3d4f60" }}>{a.credential}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(46,204,113,0.1)", color: "#2ecc71" }}>
                        Signed
                      </span>
                      <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>{fmtDate(a.approved_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Documents */}
          <Section title={`Documents (${documents.length})`}>
            {documents.length === 0 ? (
              <Empty>No documents uploaded.</Empty>
            ) : (
              <div className="space-y-2">
                {[...documents]
                  .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(45,156,219,0.06)" }}
                    >
                      <div className="min-w-0">
                        <p className="text-xs truncate" style={{ color: "#e8f4ff" }} title={doc.file_name}>
                          {doc.file_name}
                        </p>
                        <p className="text-xs" style={{ color: "#3d4f60" }}>
                          {formatBytes(doc.file_size)}{doc.file_type ? ` · ${doc.file_type.toUpperCase()}` : ""} · {fmtDate(doc.created_at)}
                        </p>
                      </div>
                      {doc.confirmed_at ? (
                        <span className="text-xs shrink-0 px-1.5 py-0.5 rounded" style={{ background: "rgba(46,204,113,0.1)", color: "#2ecc71" }}>
                          ✓ OTP
                        </span>
                      ) : (
                        <span className="text-xs shrink-0 px-1.5 py-0.5 rounded" style={{ background: "rgba(224,168,50,0.1)", color: "#e0a832" }}>
                          Pending
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </Section>

          {/* Recent Activity */}
          <Section title="Recent Activity">
            {activity.length === 0 ? (
              <Empty>No activity recorded.</Empty>
            ) : (
              <div className="space-y-2">
                {activity.slice(0, 12).map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: "#2d9cdb" }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs" style={{ color: "#e8f4ff" }}>
                        {formatAction(log.action)}
                      </p>
                      <p className="text-xs" style={{ color: "#3d4f60" }}>
                        {fmtDateTime(log.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.12)" }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#e8f4ff" }}>{title}</h3>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs" style={{ color: "#3d4f60" }}>{children}</p>;
}

function formatAction(action: string) {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
