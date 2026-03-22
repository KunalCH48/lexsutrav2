"use client";

const RISK_LABELS: Record<string, string> = {
  unacceptable:    "Unacceptable Risk",
  high_risk:       "High Risk",
  limited_risk:    "Limited Risk",
  minimal_risk:    "Minimal Risk",
  general_purpose: "General Purpose AI",
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

export type InventorySystem = {
  id:                string;
  name:              string;
  url:               string | null;
  description:       string | null;  // use case
  role:              string | null;
  data_subjects:     string | null;
  deployment_status: string | null;
  risk_category:     string | null;
  risk_reason:       string | null;
  annex_iii_domain:  string | null;
  created_at:        string;
};

function escapeCSV(val: string) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function buildCSV(systems: InventorySystem[], companyName: string): string {
  const HEADERS = [
    "AI System Name",
    "System URL",
    "Primary Purpose / Use Case",
    "Your Role",
    "Data Subjects Affected",
    "Deployment Status",
    "Risk Category (LexSutra Assessment)",
    "EU AI Act Annex III Domain",
    "LexSutra Assessment Notes",
    "Date Added",
  ];

  const rows: string[][] = [
    // Metadata header rows
    [`LexSutra AI Inventory — ${companyName}`, `Exported: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`],
    [],
    HEADERS,
    ...systems.map((s) => [
      s.name,
      s.url ?? "",
      s.description ?? "",
      s.role ? (ROLE_LABELS[s.role] ?? s.role) : "",
      s.data_subjects ?? "",
      s.deployment_status ? (STATUS_LABELS[s.deployment_status] ?? s.deployment_status) : "",
      s.risk_category ? (RISK_LABELS[s.risk_category] ?? s.risk_category) : "Pending",
      s.annex_iii_domain ?? "—",
      s.risk_reason ?? "",
      new Date(s.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    ]),
  ];

  return rows.map((r) => r.map(escapeCSV).join(",")).join("\r\n");
}

export function ExportInventoryButton({
  systems,
  companyName,
}: {
  systems: InventorySystem[];
  companyName: string;
}) {
  function handleExport() {
    const csv = buildCSV(systems, companyName);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = companyName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
    const date = new Date().toISOString().slice(0, 10);
    a.download = `LexSutra_AI_Inventory_${slug}_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      disabled={systems.length === 0}
      className="flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-30"
      style={{
        background: "rgba(200,168,75,0.08)",
        color:      "#c8a84b",
        border:     "1px solid rgba(200,168,75,0.25)",
      }}
      title={systems.length === 0 ? "No systems to export" : "Export full AI inventory as CSV"}
    >
      ↓ Export CSV
    </button>
  );
}
