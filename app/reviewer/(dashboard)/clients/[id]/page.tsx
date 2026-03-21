import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ClientNotesPanel } from "@/components/admin/ClientNotesPanel";
import { ResearchIntelSummary } from "@/components/admin/ResearchIntelSummary";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client Detail — LexSutra Reviewer" };

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

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatAction(action: string) {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ReviewerClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const adminClient = createSupabaseAdminClient();

  // Guard: reviewer must be assigned to this company
  const { data: access } = await adminClient
    .from("reviewer_company_access")
    .select("company_id")
    .eq("reviewer_id", user.id)
    .eq("company_id", id)
    .maybeSingle();

  if (!access) notFound();

  // Fetch company
  const { data: company, error: companyErr } = await adminClient
    .from("companies")
    .select("id, name, contact_email, created_at")
    .eq("id", id)
    .single();

  if (companyErr || !company) notFound();

  // Fetch everything in parallel
  const [
    { data: aiSystems },
    { data: documents },
    { data: allDemoRequests },
    { data: activityLogs },
    { data: notes },
    { data: allProfiles },
  ] = await Promise.all([
    adminClient.from("ai_systems").select("id, name, risk_category, description").eq("company_id", id),
    adminClient.from("documents").select("id, file_name, file_size, file_type, confirmed_at, created_at").eq("company_id", id).order("created_at", { ascending: false }),
    adminClient.from("demo_requests").select("id, status, created_at, company_name, contact_email, website_url, research_brief, insights_snapshot, scan_quality").order("created_at", { ascending: false }),
    adminClient.from("activity_log").select("id, action, created_at").eq("entity_id", id).order("created_at", { ascending: false }).limit(15),
    adminClient.from("company_notes").select("id, content, created_at, created_by").eq("company_id", id).order("created_at", { ascending: false }),
    adminClient.from("profiles").select("id, display_name, role"),
  ]);

  const systems = aiSystems ?? [];
  const docs    = documents ?? [];

  const matchedDemos = (allDemoRequests ?? []).filter((d: any) =>
    company.contact_email && d.contact_email?.toLowerCase() === company.contact_email.toLowerCase()
  );

  // Build author map: id → {display_name, role}
  type ProfileRef = { id: string; display_name: string | null; role: string };
  const profileMap = new Map<string, ProfileRef>(
    (allProfiles ?? []).map((p: ProfileRef) => [p.id, p])
  );

  const notesWithAuthors = (notes ?? []).map((n: any) => {
    const author = n.created_by ? profileMap.get(n.created_by) : null;
    return { ...n, author_name: author?.display_name ?? null, author_role: author?.role ?? null };
  });

  // Split notes: admin notes (read-only for reviewer) vs reviewer notes (editable)
  const adminNotes    = notesWithAuthors.filter((n: any) => n.author_role === "admin");
  const reviewerNotes = notesWithAuthors.filter((n: any) => n.author_role === "reviewer");

  // Diagnostics
  let diagnostics: any[] = [];
  let findings: any[] = [];
  let approvals: any[] = [];
  let reportSnapshots: any[] = [];

  if (systems.length > 0) {
    const systemIds = systems.map((s: any) => s.id);
    const { data: diags } = await adminClient
      .from("diagnostics")
      .select("id, ai_system_id, status, created_at")
      .in("ai_system_id", systemIds)
      .order("created_at", { ascending: false });
    diagnostics = diags ?? [];

    if (diagnostics.length > 0) {
      const diagIds = diagnostics.map((d: any) => d.id);
      const [findingsRes, approvalsRes, snapshotsRes] = await Promise.all([
        adminClient.from("diagnostic_findings").select("diagnostic_id, rag_status").in("diagnostic_id", diagIds),
        adminClient.from("report_approvals").select("id, diagnostic_id, reviewer_name, credential, approved_at").in("diagnostic_id", diagIds).not("approved_at", "is", null).order("approved_at", { ascending: false }),
        adminClient.from("diagnostic_report_snapshots").select("id, diagnostic_id, snapshot_number, grade, version_note, approved_at").in("diagnostic_id", diagIds).order("snapshot_number", { ascending: false }),
      ]);
      findings       = findingsRes.data ?? [];
      approvals      = approvalsRes.data ?? [];
      reportSnapshots = snapshotsRes.data ?? [];
    }
  }

  const critsByDiag = new Map<string, number>();
  for (const f of findings as { diagnostic_id: string; rag_status: string }[]) {
    if (f.rag_status === "red") {
      critsByDiag.set(f.diagnostic_id, (critsByDiag.get(f.diagnostic_id) ?? 0) + 1);
    }
  }

  const snapshotsByDiag = new Map<string, any[]>();
  for (const snap of reportSnapshots) {
    const list = snapshotsByDiag.get(snap.diagnostic_id) ?? [];
    list.push(snap);
    snapshotsByDiag.set(snap.diagnostic_id, list);
  }

  const criticals     = findings.filter((f: any) => f.rag_status === "red").length;
  const confirmedDocs = docs.filter((d: any) => d.confirmed_at).length;
  const latestDemoWithResearch = matchedDemos.find((d: any) => d.research_brief || d.insights_snapshot) ?? null;

  return (
    <div className="max-w-5xl">
      <Link href="/reviewer/clients" className="gold-link text-sm flex items-center gap-1.5 mb-6 w-fit">
        ← Back to My Clients
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
          <p className="text-sm" style={{ color: "#8899aa" }}>{company.contact_email}</p>
          <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>Client since {fmtDate(company.created_at)}</p>
        </div>
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

      {/* Notes — two sections: Admin Notes (read-only) + Reviewer Notes (editable) */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <Section title="Admin Notes">
          {adminNotes.length === 0 ? (
            <p className="text-xs" style={{ color: "#3d4f60" }}>No admin notes yet.</p>
          ) : (
            <div className="space-y-3">
              {adminNotes.map((note: any) => (
                <div
                  key={note.id}
                  className="rounded-lg p-3"
                  style={{ background: "rgba(200,168,75,0.05)", border: "1px solid rgba(200,168,75,0.15)" }}
                >
                  <p className="text-sm whitespace-pre-wrap" style={{ color: "#e8f4ff" }}>{note.content}</p>
                  <p className="text-xs mt-2" style={{ color: "#3d4f60" }}>
                    {note.author_name ?? "Admin"} · {fmtDateTime(note.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Reviewer Notes">
          <ClientNotesPanel
            companyId={id}
            initialNotes={reviewerNotes}
            currentUserId={user.id}
          />
        </Section>
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
                        <span className="text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block" style={{ background: "rgba(255,255,255,0.05)", color: "#8899aa", border: "1px solid rgba(255,255,255,0.08)" }}>
                          {sys.risk_category}
                        </span>
                      )}
                    </div>
                    {sysDiags.length === 0 ? (
                      <p className="text-xs" style={{ color: "#3d4f60" }}>No diagnostics yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {sysDiags.map((d: any) => {
                          const crits     = critsByDiag.get(d.id) ?? 0;
                          const approval  = approvals.find((a: any) => a.diagnostic_id === d.id);
                          const diagSnaps = snapshotsByDiag.get(d.id) ?? [];
                          return (
                            <div
                              key={d.id}
                              className="rounded-lg px-3 py-2 space-y-1.5"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(45,156,219,0.06)" }}
                            >
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <StatusBadge status={d.status} />
                                  <span className="text-xs" style={{ color: "#3d4f60" }}>{fmtDate(d.created_at)}</span>
                                  {crits > 0 && (
                                    <span className="text-xs px-1.5 rounded" style={{ background: "rgba(224,82,82,0.1)", color: "#e05252" }}>{crits} critical</span>
                                  )}
                                  {approval && (
                                    <span className="text-xs" style={{ color: "#2ecc71" }} title={`Signed by ${approval.reviewer_name}`}>✓ signed</span>
                                  )}
                                </div>
                                <Link href={`/reviewer/diagnostics/${d.id}`} className="text-xs shrink-0" style={{ color: "#2d9cdb" }}>
                                  Review →
                                </Link>
                              </div>
                              {diagSnaps.length > 0 && (
                                <div className="pl-2 space-y-1" style={{ borderLeft: "2px solid rgba(200,168,75,0.2)" }}>
                                  {diagSnaps.map((snap: any) => (
                                    <div key={snap.id} className="flex items-center gap-2 text-xs">
                                      <span style={{ color: "#c8a84b", fontFamily: "monospace" }}>v{snap.snapshot_number}</span>
                                      {snap.grade && (
                                        <span style={{
                                          color: ["A+","A","B+"].includes(snap.grade) ? "#2ecc71"
                                            : ["B","C+"].includes(snap.grade) ? "#e0a832"
                                            : "#e05252",
                                          fontWeight: 600,
                                        }}>
                                          {snap.grade}
                                        </span>
                                      )}
                                      {snap.version_note && (
                                        <span className="italic truncate" style={{ color: "#5a6a7a" }}>{snap.version_note}</span>
                                      )}
                                      <span className="ml-auto shrink-0" style={{ color: "#3d4f60" }}>{fmtDate(snap.approved_at)}</span>
                                    </div>
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
              })
            )}
          </Section>

          {/* Demo Requests */}
          <Section title={`Demo Requests (${matchedDemos.length})`}>
            {matchedDemos.length === 0 ? (
              <Empty>No demo requests linked.</Empty>
            ) : (
              <div className="space-y-2">
                {matchedDemos.map((d: any) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(45,156,219,0.06)" }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={d.status} />
                      <span className="text-xs" style={{ color: "#3d4f60" }}>{fmtDate(d.created_at)}</span>
                      {d.scan_quality && (
                        <span className="text-xs px-1.5 rounded" style={{ background: "rgba(45,156,219,0.08)", color: "#2d9cdb" }}>
                          {d.scan_quality}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/reviewer/demo-requests/${d.id}`}
                      className="text-xs shrink-0 font-medium"
                      style={{ color: "#2d9cdb" }}
                    >
                      Review →
                    </Link>
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

          {/* Research & Intelligence */}
          {latestDemoWithResearch && (
            <Section title="Research & Intelligence">
              <ResearchIntelSummary
                insightsSnapshot={latestDemoWithResearch.insights_snapshot}
                researchBrief={latestDemoWithResearch.research_brief ?? null}
                demoId={latestDemoWithResearch.id}
                linkPrefix="/reviewer"
              />
            </Section>
          )}

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
