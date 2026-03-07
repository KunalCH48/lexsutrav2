"use client";

const HEADERS = [
  "AI System Name",
  "Primary Purpose / Use Case",
  "Risk Category",
  "Your Role",
  "Data Subjects Affected",
  "Vendor (Internal / Third-party)",
  "Deployment Status",
  "EU AI Act Annex III Domain",
  "Compliance Assessment Status",
  "Owner / Contact",
  "Notes",
];

const RISK_OPTIONS = "High Risk | Potentially High Risk | Limited Risk | Minimal Risk | Unacceptable Risk";
const ROLE_OPTIONS = "Provider | Deployer | Provider + Deployer";
const STATUS_OPTIONS = "Active | Piloting | Planned | Decommissioned";
const COMPLIANCE_OPTIONS = "Not Started | In Progress | Completed";

const GUIDE_ROW = [
  "e.g. HR Screening Tool",
  "e.g. Rank job applicants automatically",
  RISK_OPTIONS,
  ROLE_OPTIONS,
  "e.g. Job applicants, Employees",
  "e.g. Internal ML model / HireVue",
  STATUS_OPTIONS,
  "e.g. Annex III – Art. 6 Employment",
  COMPLIANCE_OPTIONS,
  "e.g. Sarah Chen, Legal",
  "Free notes",
];

function escapeCSV(val: string) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function buildCSV(includeExample: boolean) {
  const rows: string[][] = [HEADERS, GUIDE_ROW];

  if (includeExample) {
    rows.push(
      ["HR Screening AI", "Rank and filter job applicants", "High Risk", "Deployer", "Job applicants", "Third-party (HireVue)", "Active", "Annex III – Art. 6 Employment", "Not Started", "Legal Team", ""],
      ["Credit Scoring Model", "Evaluate loan applications and set credit limits", "High Risk", "Provider + Deployer", "Customers", "Internal ML model", "Active", "Annex III – Art. 6 Credit", "Not Started", "CTO", ""],
      ["Predictive Maintenance Model", "Detect equipment failure before it occurs", "Likely Low Risk", "Provider", "None", "Internal ML model", "Active", "—", "Not Started", "Engineering", ""],
      ["Customer Service Chatbot", "Handle inbound support queries", "Limited Risk", "Deployer", "Customers", "Third-party (OpenAI)", "Active", "—", "Not Started", "Product Team", "Transparency obligation applies"],
      ["Employee Monitoring System", "Track productivity and flag anomalies", "High Risk", "Deployer", "Employees", "Internal", "Piloting", "Annex III – Art. 6 Employment", "Not Started", "HR Director", "Review recommended before go-live"],
    );
  } else {
    // 10 blank rows
    for (let i = 0; i < 10; i++) rows.push(Array(HEADERS.length).fill(""));
  }

  return rows.map((r) => r.map(escapeCSV).join(",")).join("\r\n");
}

export function DownloadInventoryButton({ example = false }: { example?: boolean }) {
  function handleClick() {
    const csv = buildCSV(example);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = example
      ? "LexSutra_AI_Inventory_Example.csv"
      : "LexSutra_AI_Inventory_Template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={handleClick} className={example ? "btn-outline-blue" : "btn-gold"}>
      {example ? "Download Example (with data)" : "Download Blank Template"}
    </button>
  );
}
