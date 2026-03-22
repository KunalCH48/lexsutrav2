import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { AddAiSystemForm } from "@/components/portal/AddAiSystemForm";
import { ExportInventoryButton, type InventorySystem } from "@/components/portal/ExportInventoryButton";

export const metadata = { title: "Company Profile — LexSutra Portal" };

const RISK_META: Record<string, { label: string; color: string }> = {
  unacceptable:    { label: "Unacceptable Risk", color: "#e05252" },
  high_risk:       { label: "High Risk",          color: "#e05252" },
  limited_risk:    { label: "Limited Risk",       color: "#e0a832" },
  minimal_risk:    { label: "Minimal Risk",       color: "#2ecc71" },
  general_purpose: { label: "General Purpose AI", color: "#8899aa" },
};

const ROLE_LABELS: Record<string, string> = {
  provider:          "Provider",
  deployer:          "Deployer",
  provider_deployer: "Provider + Deployer",
};

const STATUS_LABELS: Record<string, string> = {
  active:         "Active",
  piloting:       "Piloting",
  planned:        "Planned",
  decommissioned: "Decommissioned",
};

const STATUS_COLORS: Record<string, string> = {
  active:         "#2ecc71",
  piloting:       "#e0a832",
  planned:        "#2d9cdb",
  decommissioned: "#3d4f60",
};

export default async function ProfilePage() {
  const supabase    = await (await import("@/lib/supabase-server")).createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await adminClient.from("profiles").select("company_id").eq("id", user.id).single();
  const companyId = profile?.company_id ?? null;
  if (!companyId) return null;

  const [companyRes, systemsRes] = await Promise.all([
    adminClient
      .from("companies")
      .select("id, name, contact_email, website_url, created_at")
      .eq("id", companyId)
      .single(),
    adminClient
      .from("ai_systems")
      .select("id, name, url, risk_category, risk_reason, annex_iii_domain, description, role, data_subjects, deployment_status, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
  ]);

  const company = companyRes.data;
  const systems: InventorySystem[] = (systemsRes.data ?? []) as InventorySystem[];

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }

  // Risk summary counts
  const highRiskCount = systems.filter(s => s.risk_category === "high_risk" || s.risk_category === "unacceptable").length;

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-serif, serif)", color: "#e8f4ff" }}
        >
          Company{" "}
          <span style={{ color: "#2d9cdb", fontStyle: "italic" }}>Profile</span>
        </h2>
      </div>

      {/* Company details */}
      <div
        className="rounded-xl p-6 space-y-5"
        style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d9cdb" }}>
          Company Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoField label="Company Name"  value={company?.name} />
          <InfoField label="Contact Email" value={company?.contact_email} mono />
          <InfoField label="Website"       value={company?.website_url} link />
          <InfoField label="Client Since"  value={company?.created_at ? fmtDate(company.created_at) : null} />
        </div>

        <p className="text-xs pt-2" style={{ color: "#3d4f60" }}>
          To update your company details, contact{" "}
          <a href="mailto:hello@send.lexsutra.com" className="gold-link">hello@send.lexsutra.com</a>.
        </p>
      </div>

      {/* AI Inventory */}
      <div
        className="rounded-xl p-6 space-y-5"
        style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
      >
        {/* Section header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d9cdb" }}>
              AI Inventory
            </h3>
            {systems.length > 0 ? (
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <p className="text-xs" style={{ color: "#3d4f60" }}>
                  {systems.length} system{systems.length === 1 ? "" : "s"} registered
                </p>
                {highRiskCount > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(224,82,82,0.1)", color: "#e05252", border: "1px solid rgba(224,82,82,0.2)" }}
                  >
                    {highRiskCount} high-risk
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>
                Register the AI systems your organisation uses or deploys.
              </p>
            )}
          </div>
          {systems.length > 0 && (
            <ExportInventoryButton
              systems={systems}
              companyName={company?.name ?? "Organisation"}
            />
          )}
        </div>

        {/* Inventory cards */}
        {systems.length > 0 && (
          <div className="space-y-3">
            {systems.map((s) => {
              const riskMeta = RISK_META[s.risk_category ?? ""] ?? { label: s.risk_category ?? "Pending", color: "#3d4f60" };
              const statusColor = STATUS_COLORS[s.deployment_status ?? ""] ?? "#3d4f60";

              return (
                <div
                  key={s.id}
                  className="rounded-lg p-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: name, url, use case, chips */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="text-sm font-medium" style={{ color: "#e8f4ff" }}>{s.name}</p>

                      {s.url && (
                        <a
                          href={s.url.startsWith("http") ? s.url : `https://${s.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono block truncate hover:opacity-80 transition-opacity"
                          style={{ color: "#3d4f60" }}
                        >
                          {s.url}
                        </a>
                      )}

                      {s.description && (
                        <p className="text-xs line-clamp-2" style={{ color: "#8899aa" }}>
                          {s.description}
                        </p>
                      )}

                      {/* Chips row */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {s.role && (
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(45,156,219,0.08)", color: "#2d9cdb" }}>
                            {ROLE_LABELS[s.role] ?? s.role}
                          </span>
                        )}
                        {s.data_subjects && (
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "#8899aa" }}>
                            {s.data_subjects}
                          </span>
                        )}
                        {s.deployment_status && (
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ background: `${statusColor}10`, color: statusColor }}
                          >
                            {STATUS_LABELS[s.deployment_status] ?? s.deployment_status}
                          </span>
                        )}
                      </div>

                      {/* Risk reason */}
                      {s.risk_reason && (
                        <p className="text-xs pt-0.5" style={{ color: "#3d4f60" }}>
                          {s.risk_reason}
                        </p>
                      )}
                    </div>

                    {/* Right: risk badge, annex domain, date */}
                    <div className="shrink-0 text-right space-y-1.5 min-w-[110px]">
                      {s.risk_category ? (
                        <span
                          className="text-xs font-medium px-2.5 py-1 rounded-full block"
                          style={{
                            background: `${riskMeta.color}18`,
                            color: riskMeta.color,
                            border: `1px solid ${riskMeta.color}40`,
                          }}
                        >
                          {riskMeta.label}
                        </span>
                      ) : (
                        <span
                          className="text-xs px-2.5 py-1 rounded-full block"
                          style={{ background: "rgba(255,255,255,0.03)", color: "#3d4f60", border: "1px solid rgba(255,255,255,0.07)" }}
                        >
                          Pending review
                        </span>
                      )}
                      {s.annex_iii_domain && (
                        <p className="text-xs font-mono leading-tight" style={{ color: "#c8a84b" }}>
                          {s.annex_iii_domain}
                        </p>
                      )}
                      <p className="text-xs" style={{ color: "#3d4f60" }}>
                        Added {fmtDate(s.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add form */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.25rem" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#3d4f60" }}>
            Register a New AI System
          </p>
          <AddAiSystemForm companyId={companyId} companyName={company?.name ?? undefined} />
        </div>
      </div>
    </div>
  );
}

function InfoField({
  label, value, link, mono,
}: {
  label: string;
  value?: string | null;
  link?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#3d4f60" }}>
        {label}
      </p>
      {value ? (
        link ? (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="gold-link text-sm break-all"
          >
            {value}
          </a>
        ) : (
          <p
            className="text-sm break-all"
            style={{ color: "#e8f4ff", fontFamily: mono ? "monospace" : undefined, fontSize: mono ? "12px" : undefined }}
          >
            {value}
          </p>
        )
      ) : (
        <p className="text-sm" style={{ color: "#3d4f60" }}>—</p>
      )}
    </div>
  );
}
