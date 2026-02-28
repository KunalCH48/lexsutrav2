import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { AddAiSystemForm } from "@/components/portal/AddAiSystemForm";

export const metadata = { title: "Company Profile — LexSutra Portal" };

const RISK_LABELS: Record<string, { label: string; color: string }> = {
  high_risk:      { label: "High-Risk",      color: "#e05252" },
  limited_risk:   { label: "Limited-Risk",   color: "#e0a832" },
  minimal_risk:   { label: "Minimal-Risk",   color: "#2ecc71" },
  unacceptable:   { label: "Unacceptable",   color: "#e05252" },
  general_purpose:{ label: "General Purpose",color: "#8899aa" },
};

export default async function ProfilePage() {
  // TODO: re-enable auth before production
  const adminClient = createSupabaseAdminClient();

  const companyId = "11111111-1111-1111-1111-111111111111";

  const [companyRes, systemsRes] = await Promise.all([
    adminClient
      .from("companies")
      .select("id, name, email, website_url, created_at")
      .eq("id", companyId)
      .single(),
    adminClient
      .from("ai_systems")
      .select("id, name, risk_category, description, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
  ]);

  const company = companyRes.data;
  const systems = systemsRes.data ?? [];

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }

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
          <InfoField label="Contact Email" value={company?.email} mono />
          <InfoField label="Website"       value={company?.website_url} link />
          <InfoField label="Client Since"  value={company?.created_at ? fmtDate(company.created_at) : null} />
        </div>

        <p className="text-xs pt-2" style={{ color: "#3d4f60" }}>
          To update your company details, contact{" "}
          <a href="mailto:hello@lexsutra.nl" className="gold-link">hello@lexsutra.nl</a>.
        </p>
      </div>

      {/* AI Systems */}
      <div
        className="rounded-xl p-6 space-y-5"
        style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2d9cdb" }}>
          AI Systems ({systems.length})
        </h3>

        {systems.length === 0 ? (
          <p className="text-sm" style={{ color: "#3d4f60" }}>
            No AI systems registered yet. Add one below to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {systems.map((s: { id: string; name: string; risk_category: string | null; description: string | null; created_at: string }) => {
              const risk = RISK_LABELS[s.risk_category ?? ""] ?? { label: s.risk_category ?? "Unknown", color: "#8899aa" };
              return (
                <div
                  key={s.id}
                  className="rounded-lg p-4 flex items-start justify-between gap-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: "#e8f4ff" }}>{s.name}</p>
                    {s.description && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#8899aa" }}>
                        {s.description}
                      </p>
                    )}
                    <p className="text-xs mt-1.5" style={{ color: "#3d4f60" }}>
                      Added {fmtDate(s.created_at)}
                    </p>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                    style={{
                      background: `${risk.color}18`,
                      color: risk.color,
                      border: `1px solid ${risk.color}40`,
                    }}
                  >
                    {risk.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Add AI System form */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.25rem" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#3d4f60" }}>
            Register a New AI System
          </p>
          <AddAiSystemForm companyId={companyId} />
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
