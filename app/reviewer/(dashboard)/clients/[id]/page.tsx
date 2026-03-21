import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client Detail — LexSutra Reviewer" };

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  // Fetch AI systems, documents, diagnostics in parallel
  const [{ data: aiSystems }, { data: documents }] = await Promise.all([
    adminClient
      .from("ai_systems")
      .select("id, name, risk_category, description")
      .eq("company_id", id),
    adminClient
      .from("documents")
      .select("id, file_name, file_size, file_type, confirmed_at, created_at")
      .eq("company_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const systems = aiSystems ?? [];
  const docs    = documents ?? [];

  // Fetch diagnostics
  let diagnostics: any[] = [];
  if (systems.length > 0) {
    const systemIds = systems.map((s: any) => s.id);
    const { data: diags } = await adminClient
      .from("diagnostics")
      .select("id, ai_system_id, status, created_at")
      .in("ai_system_id", systemIds)
      .order("created_at", { ascending: false });
    diagnostics = diags ?? [];
  }

  return (
    <div className="max-w-4xl">
      <Link href="/reviewer/clients" className="gold-link text-sm flex items-center gap-1.5 mb-6 w-fit">
        ← Back to My Clients
      </Link>

      <div className="mb-8">
        <h2
          className="text-2xl font-semibold mb-1"
          style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
        >
          {company.name}
        </h2>
        <p className="text-sm" style={{ color: "#8899aa" }}>{company.contact_email}</p>
        <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>Client since {fmtDate(company.created_at)}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "AI Systems",  value: systems.length },
          { label: "Diagnostics", value: diagnostics.length },
          { label: "Documents",   value: docs.filter((d: any) => d.confirmed_at).length + "/" + docs.length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.12)" }}>
            <p className="text-xs mb-1" style={{ color: "#3d4f60" }}>{label}</p>
            <p className="text-2xl font-semibold" style={{ color: "#e8f4ff" }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* AI Systems & Diagnostics */}
        <Section title="AI Systems & Diagnostics">
          {systems.length === 0 ? (
            <Empty>No AI systems registered.</Empty>
          ) : (
            systems.map((sys: any) => {
              const sysDiags = diagnostics.filter((d: any) => d.ai_system_id === sys.id);
              return (
                <div
                  key={sys.id}
                  className="mb-4 last:mb-0 pb-4 last:pb-0"
                  style={{ borderBottom: "1px solid rgba(45,156,219,0.08)" }}
                >
                  <p className="text-sm font-medium mb-1" style={{ color: "#e8f4ff" }}>{sys.name}</p>
                  {sys.risk_category && (
                    <span className="text-xs px-1.5 py-0.5 rounded inline-block mb-2" style={{ background: "rgba(255,255,255,0.05)", color: "#8899aa", border: "1px solid rgba(255,255,255,0.08)" }}>
                      {sys.risk_category}
                    </span>
                  )}
                  {sysDiags.length === 0 ? (
                    <p className="text-xs" style={{ color: "#3d4f60" }}>No diagnostics yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {sysDiags.map((d: any) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(45,156,219,0.06)" }}
                        >
                          <div className="flex items-center gap-2">
                            <StatusBadge status={d.status} />
                            <span className="text-xs" style={{ color: "#3d4f60" }}>{fmtDate(d.created_at)}</span>
                          </div>
                          <Link href={`/reviewer/diagnostics/${d.id}`} className="text-xs shrink-0" style={{ color: "#2d9cdb" }}>
                            Review →
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </Section>

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
                      {formatBytes(doc.file_size)} · {fmtDate(doc.created_at)}
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
