import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LoginAsButton } from "@/components/admin/LoginAsButton";
import { CompanyReviewerPanel } from "@/components/admin/CompanyReviewerPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client Detail — LexSutra Admin" };

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function normalizeUrl(u: string | null) {
  if (!u) return "";
  return u.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatAction(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminClient = createSupabaseAdminClient();

  // 1. Company
  const { data: company, error: companyErr } = await adminClient
    .from("companies")
    .select("id, name, contact_email, website_url, created_at")
    .eq("id", id)
    .single();

  if (companyErr || !company) notFound();

  // 2. Everything else in parallel (flat queries — no deep nesting)
  const [
    { data: aiSystems },
    { data: documents },
    { data: demoRequests },
    { data: clientProfile },
    { data: activityLogs },
    { data: allReviewers },
    { data: assignedAccess },
  ] = await Promise.all([
    adminClient.from("ai_systems").select("id, name, risk_category, description").eq("company_id", id),
    adminClient.from("documents").select("id, file_name, file_size, file_type, confirmed_at, created_at").eq("company_id", id).order("created_at", { ascending: false }),
    adminClient.from("demo_requests").select("id, status, created_at, company_name, contact_email, website_url").order("created_at", { ascending: false }),
    adminClient.from("profiles").select("id, display_name, role").eq("company_id", id).eq("role", "client").maybeSingle(),
    adminClient.from("activity_log").select("id, action, created_at").eq("entity_id", id).order("created_at", { ascending: false }).limit(15),
    adminClient.from("profiles").select("id, display_name, credential").eq("role", "reviewer").order("display_name"),
    adminClient.from("reviewer_company_access").select("reviewer_id").eq("company_id", id),
  ]);

  const systems = aiSystems ?? [];
  const docs    = documents ?? [];

  // Find matching demo request by email OR website URL
  const demo = (demoRequests ?? []).find((d: any) =>
    (company.contact_email && d.contact_email?.toLowerCase() === company.contact_email.toLowerCase()) ||
    (company.website_url && d.website_url && normalizeUrl(d.website_url) === normalizeUrl(company.website_url))
  ) ?? null;

  // 3. Diagnostics for this company's AI systems (flat)
  const systemIds = systems.map((s: any) => s.id);
  let diagnostics: any[] = [];
  let findings: any[] = [];

  if (systemIds.length > 0) {
    const { data: diags } = await adminClient
      .from("diagnostics")
      .select("id, ai_system_id, status, created_at")
      .in("ai_system_id", systemIds)
      .order("created_at", { ascending: false });
    diagnostics = diags ?? [];

    if (diagnostics.length > 0) {
      const diagIds = diagnostics.map((d: any) => d.id);
      const { data: findingsData } = await adminClient
        .from("diagnostic_findings")
        .select("diagnostic_id, rag_status")
        .in("diagnostic_id", diagIds);
      findings = findingsData ?? [];
    }
  }

  // Build criticals per diagnostic
  const critsByDiag = new Map<string, number>();
  for (const f of findings as { diagnostic_id: string; rag_status: string }[]) {
    if (f.rag_status === "red") {
      critsByDiag.set(f.diagnostic_id, (critsByDiag.get(f.diagnostic_id) ?? 0) + 1);
    }
  }

  // 4. Reviewer sign-offs
  let approvals: any[] = [];
  if (diagnostics.length > 0) {
    const diagIds = diagnostics.map((d: any) => d.id);
    const { data } = await adminClient
      .from("report_approvals")
      .select("id, diagnostic_id, reviewer_name, credential, approved_at")
      .in("diagnostic_id", diagIds)
      .not("approved_at", "is", null)
      .order("approved_at", { ascending: false });
    approvals = data ?? [];
  }

  const assignedReviewerIds = (assignedAccess ?? []).map((r: any) => r.reviewer_id);

  // Stats
  const criticals     = findings.filter((f: any) => f.rag_status === "red").length;
  const confirmedDocs = docs.filter((d: any) => d.confirmed_at).length;

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
                <a href={company.website_url} target="_blank" rel="noopener noreferrer" className="gold-link">
                  {normalizeUrl(company.website_url)}
                </a>
              </>
            )}
          </p>
          <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>
            Client since {fmtDate(company.created_at)}
          </p>
        </div>

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
          { label: "AI Systems",    value: systems.length },
          { label: "Diagnostics",   value: diagnostics.length },
          { label: "Critical Gaps", value: criticals, color: criticals > 0 ? "#e05252" : undefined },
          { label: "Documents",     value: `${confirmedDocs}/${docs.length}` },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.12)" }}>
            <p className="text-xs mb-1" style={{ color: "#3d4f60" }}>{label}</p>
            <p className="text-2xl font-semibold" style={{ color: color ?? "#e8f4ff" }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left */}
        <div className="space-y-6">

          {/* AI Systems + Diagnostics */}
          <Section title="AI Systems & Diagnostics">
            {systems.length === 0 ? (
              <Empty>No AI systems registered.</Empty>
            ) : (
              systems.map((sys: any) => {
                const sysDiags = diagnostics
                  .filter((d: any) => d.ai_system_id === sys.id)
                  .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                return (
                  <div
                    key={sys.id}
                    className="mb-4 last:mb-0 pb-4 last:pb-0"
                    style={{ borderBottom: "1px solid rgba(45,156,219,0.08)" }}
                  >
                    <div className="mb-2">
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

                    {sysDiags.length === 0 ? (
                      <p className="text-xs" style={{ color: "#3d4f60" }}>No diagnostics yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {sysDiags.map((d: any) => {
                          const crits    = critsByDiag.get(d.id) ?? 0;
                          const approval = approvals.find((a: any) => a.diagnostic_id === d.id);
                          return (
                            <div
                              key={d.id}
                              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(45,156,219,0.06)" }}
                            >
                              <div className="flex items-center gap-2 flex-wrap">
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
                              <Link href={`/admin/diagnostics/${d.id}`} className="text-xs shrink-0" style={{ color: "#2d9cdb" }}>
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
            {demo ? (
              <div className="flex items-center justify-between">
                <div>
                  <StatusBadge status={demo.status} />
                  <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>Submitted {fmtDate(demo.created_at)}</p>
                </div>
                <Link
                  href={`/admin/demo-requests/${demo.id}`}
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

          {/* Reviewers — assign access */}
          <Section title="Reviewers">
            <CompanyReviewerPanel
              companyId={id}
              allReviewers={allReviewers ?? []}
              assignedReviewerIds={assignedReviewerIds}
            />
            {/* Sign-off history */}
            {approvals.length > 0 && (
              <div className="mt-4 pt-4 space-y-2" style={{ borderTop: "1px solid rgba(45,156,219,0.08)" }}>
                <p className="text-xs font-medium mb-2" style={{ color: "#3d4f60" }}>Report sign-offs</p>
                {approvals.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <p className="text-xs" style={{ color: "#8899aa" }}>{a.reviewer_name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(46,204,113,0.1)", color: "#2ecc71" }}>✓ Signed</span>
                      <span className="text-xs" style={{ color: "#3d4f60" }}>{fmtDate(a.approved_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Right */}
        <div className="space-y-6">

          {/* Documents */}
          <Section title={`Documents (${docs.length})`}>
            {docs.length === 0 ? (
              <Empty>No documents uploaded.</Empty>
            ) : (
              <div className="space-y-2">
                {docs.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(45,156,219,0.06)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs truncate" style={{ color: "#e8f4ff" }} title={doc.file_name}>{doc.file_name}</p>
                      <p className="text-xs" style={{ color: "#3d4f60" }}>
                        {formatBytes(doc.file_size)}{doc.file_type ? ` · ${doc.file_type.split("/")[1]?.toUpperCase() ?? doc.file_type}` : ""} · {fmtDate(doc.created_at)}
                      </p>
                    </div>
                    {doc.confirmed_at ? (
                      <span className="text-xs shrink-0 px-1.5 py-0.5 rounded" style={{ background: "rgba(46,204,113,0.1)", color: "#2ecc71" }}>✓ OTP</span>
                    ) : (
                      <span className="text-xs shrink-0 px-1.5 py-0.5 rounded" style={{ background: "rgba(224,168,50,0.1)", color: "#e0a832" }}>Pending</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Recent Activity */}
          <Section title="Recent Activity">
            {(activityLogs ?? []).length === 0 ? (
              <Empty>No activity recorded.</Empty>
            ) : (
              <div className="space-y-2">
                {(activityLogs ?? []).map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "#2d9cdb" }} />
                    <div>
                      <p className="text-xs" style={{ color: "#e8f4ff" }}>{formatAction(log.action)}</p>
                      <p className="text-xs" style={{ color: "#3d4f60" }}>{fmtDateTime(log.created_at)}</p>
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
    <div className="rounded-xl p-5" style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.12)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "#e8f4ff" }}>{title}</h3>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs" style={{ color: "#3d4f60" }}>{children}</p>;
}
