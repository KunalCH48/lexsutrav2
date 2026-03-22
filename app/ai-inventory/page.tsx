import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Building2, Users, CreditCard, Package, ArrowRight, Download } from "lucide-react";
import { DownloadInventoryButton } from "@/components/DownloadInventoryButton";

export const metadata: Metadata = {
  title: "EU AI Act — AI System Inventory Template | LexSutra",
  description:
    "Regulators don't ask 'are you compliant?' first. They ask 'what AI systems do you have?' Download the free inventory template and start your EU AI Act preparation today.",
};

// ─── Data ────────────────────────────────────────────────────────────────────

const MISTAKES = [
  {
    number: "01",
    title: "No AI system inventory",
    description:
      "Companies ask 'are we compliant?' when regulators expect something different first: 'what AI systems do you actually have?' Without an inventory, compliance work becomes guesswork.",
    icon: Package,
    color: "#e05252",
    bg: "rgba(224,82,82,0.08)",
    border: "rgba(224,82,82,0.2)",
  },
  {
    number: "02",
    title: "Assuming existing processes cover the AI Act",
    description:
      "ISO standards, product safety rules, and software quality systems do not automatically satisfy AI Act obligations. Dataset governance, bias evaluation, and Annex IV documentation are entirely new requirements.",
    icon: AlertTriangle,
    color: "#e0a832",
    bg: "rgba(224,168,50,0.08)",
    border: "rgba(224,168,50,0.2)",
  },
  {
    number: "03",
    title: "Confusing provider and deployer responsibilities",
    description:
      "Using AI from a vendor does not transfer all compliance responsibility. If you use AI for hiring, credit scoring, or employee monitoring — you are the deployer, and deployers have their own obligations.",
    icon: Users,
    color: "#2d9cdb",
    bg: "rgba(45,156,219,0.08)",
    border: "rgba(45,156,219,0.2)",
  },
];

const EXAMPLE_SYSTEMS = [
  {
    name: "HR Screening AI",
    purpose: "Rank and filter job applicants",
    risk: "High Risk",
    riskColor: "#e05252",
    riskBg: "rgba(224,82,82,0.12)",
    role: "Deployer",
    dataSubjects: "Job applicants",
    vendor: "Third-party vendor",
    status: "Active",
    annexIII: "Art. 6 — Employment",
    icon: Users,
  },
  {
    name: "Credit Scoring Model",
    purpose: "Evaluate loan applications and set limits",
    risk: "High Risk",
    riskColor: "#e05252",
    riskBg: "rgba(224,82,82,0.12)",
    role: "Provider + Deployer",
    dataSubjects: "Customers",
    vendor: "Internal ML model",
    status: "Active",
    annexIII: "Art. 6 — Credit",
    icon: CreditCard,
  },
  {
    name: "Predictive Maintenance Model",
    purpose: "Detect equipment failure before it occurs",
    risk: "Likely Low Risk",
    riskColor: "#2ecc71",
    riskBg: "rgba(46,204,113,0.12)",
    role: "Provider",
    dataSubjects: "None",
    vendor: "Internal ML model",
    status: "Active",
    annexIII: "—",
    icon: Building2,
  },
  {
    name: "Customer Service Chatbot",
    purpose: "Handle inbound support queries",
    risk: "Limited Risk",
    riskColor: "#2d9cdb",
    riskBg: "rgba(45,156,219,0.12)",
    role: "Deployer",
    dataSubjects: "Customers",
    vendor: "Third-party (OpenAI)",
    status: "Active",
    annexIII: "—",
    icon: Users,
  },
  {
    name: "Employee Monitoring System",
    purpose: "Track productivity and flag anomalies",
    risk: "High Risk",
    riskColor: "#e05252",
    riskBg: "rgba(224,82,82,0.12)",
    role: "Deployer",
    dataSubjects: "Employees",
    vendor: "Internal",
    status: "Piloting",
    annexIII: "Art. 6 — Employment",
    icon: Users,
  },
];

const ROLE_GUIDE = [
  {
    role: "Provider",
    definition: "Develops or places the AI system on the market.",
    obligations: ["Technical documentation (Annex IV)", "Conformity assessment", "CE marking", "Registration in EU database"],
    example: "A startup that builds and sells an AI hiring tool.",
  },
  {
    role: "Deployer",
    definition: "Uses the AI system in their own operations.",
    obligations: ["Human oversight mechanisms", "Usage logs & monitoring", "Fundamental rights impact assessment", "Staff training"],
    example: "An employer using an AI tool to screen CVs.",
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center"
      style={{
        background: "rgba(6,10,20,0.88)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-semibold select-none" style={{ fontFamily: "var(--font-serif)" }}>
            <span style={{ color: "#c9a84c" }}>Lex</span>
            <span className="text-white">Sutra</span>
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="nav-link text-sm hidden sm:block">← Back to home</Link>
          <Link
            href="/#request"
            className="btn-gold px-4 py-2 text-sm font-semibold rounded-md"
          >
            Request Diagnostic
          </Link>
        </div>
      </div>
    </nav>
  );
}

function RiskBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ color, background: bg }}
    >
      {label}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isDeployer = role.includes("Deployer");
  const isProvider = role.includes("Provider");
  const isBoth = isDeployer && isProvider;
  const color = isBoth ? "#c9a84c" : isDeployer ? "#2d9cdb" : "#8899aa";
  const bg = isBoth ? "rgba(201,168,76,0.12)" : isDeployer ? "rgba(45,156,219,0.12)" : "rgba(136,153,170,0.12)";
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color, background: bg }}>
      {role}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AIInventoryPage() {
  return (
    <div className="min-h-screen" style={{ background: "#060a14" }}>
      <Navbar />

      <main className="pt-16">

        {/* ── Hero ── */}
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs font-medium animate-fade-up"
            style={{ background: "rgba(224,82,82,0.1)", border: "1px solid rgba(224,82,82,0.25)", color: "#e05252" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            EU AI Act compliance deadline: 2 August 2026
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-up delay-100"
            style={{ fontFamily: "var(--font-serif)", color: "#e8f4ff" }}
          >
            Before compliance,<br />
            <span className="gold-shimmer">you need an inventory.</span>
          </h1>

          <p className="text-lg max-w-2xl mx-auto mb-10 animate-fade-up delay-200" style={{ color: "#8899aa", lineHeight: 1.7 }}>
            Regulators don&apos;t ask <em>&ldquo;are you compliant?&rdquo;</em> first.
            They ask <em>&ldquo;what AI systems do you actually have?&rdquo;</em>
            A complete AI system inventory is the foundation of every EU AI Act assessment.
          </p>

          <div className="flex flex-wrap justify-center gap-4 animate-fade-up delay-300">
            <DownloadInventoryButton />
            <DownloadInventoryButton example />
          </div>

          <p className="text-xs mt-4 animate-fade-up delay-400" style={{ color: "#3d4f60" }}>
            Free to use. No sign-up required. CSV format — open in Excel, Google Sheets, or Notion.
          </p>

          {/* Quote nudge */}
          <div
            className="mt-10 max-w-xl mx-auto rounded-xl px-6 py-4 flex flex-col sm:flex-row items-center gap-4 animate-fade-up delay-400"
            style={{ background: "#0d1520", border: "1px solid rgba(201,168,76,0.2)" }}
          >
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold mb-0.5" style={{ color: "#e8f4ff" }}>
                Already know what AI systems you have?
              </p>
              <p className="text-xs" style={{ color: "#8899aa" }}>
                Tell us your context — we&apos;ll come back with a tailored quote. No commitment.
              </p>
            </div>
            <a
              href="/#request"
              className="btn-gold px-5 py-2.5 text-sm font-semibold rounded-lg whitespace-nowrap shrink-0"
            >
              Request a Quote →
            </a>
          </div>

          {/* Smart Inventory nudge */}
          <div
            className="mt-4 max-w-xl mx-auto rounded-xl px-6 py-4 flex flex-col sm:flex-row items-center gap-4 animate-fade-up delay-400"
            style={{ background: "rgba(45,156,219,0.04)", border: "1px solid rgba(45,156,219,0.15)" }}
          >
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(45,156,219,0.12)", color: "#2d9cdb", border: "1px solid rgba(45,156,219,0.25)" }}
                >
                  LexSutra clients
                </span>
              </div>
              <p className="text-sm font-semibold mt-1 mb-0.5" style={{ color: "#e8f4ff" }}>
                Smart AI Inventory — risk assessed automatically
              </p>
              <p className="text-xs" style={{ color: "#8899aa" }}>
                Register each AI system in your portal and we&apos;ll assess its EU AI Act risk level for you. No spreadsheets.
              </p>
            </div>
            <Link
              href="/portal"
              className="text-xs font-semibold px-4 py-2 rounded-lg whitespace-nowrap shrink-0 transition-opacity hover:opacity-80"
              style={{
                background: "rgba(45,156,219,0.12)",
                color: "#2d9cdb",
                border: "1px solid rgba(45,156,219,0.25)",
              }}
            >
              Go to portal →
            </Link>
          </div>

        </section>

        {/* ── 3 Common Mistakes ── */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: "#c9a84c" }}>
              Why this matters
            </p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "#e8f4ff" }}>
              The 3 most common mistakes companies make
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {MISTAKES.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.number}
                  className="rounded-2xl p-6 card-hover"
                  style={{ background: m.bg, border: `1px solid ${m.border}` }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${m.color}18` }}>
                      <Icon size={18} style={{ color: m.color }} />
                    </div>
                    <span className="text-3xl font-bold opacity-20 mt-0.5" style={{ color: m.color, fontFamily: "var(--font-serif)" }}>
                      {m.number}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold mb-3" style={{ color: "#e8f4ff" }}>
                    {m.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#8899aa" }}>
                    {m.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Example Inventory Table ── */}
        <section className="py-16" style={{ background: "#080c14" }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-10">
              <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: "#c9a84c" }}>
                The template
              </p>
              <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-serif)", color: "#e8f4ff" }}>
                What an AI system inventory looks like
              </h2>
              <p className="text-sm max-w-xl mx-auto" style={{ color: "#8899aa" }}>
                Five example systems — from clearly low-risk to definitely high-risk. Your inventory is the starting point for every compliance decision that follows.
              </p>
            </div>

            {/* Table */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* Table header */}
              <div
                className="grid gap-3 px-5 py-3 text-xs uppercase tracking-wider font-semibold"
                style={{
                  background: "#0d1520",
                  color: "#3d4f60",
                  gridTemplateColumns: "1.6fr 2fr 1.2fr 1.3fr 1.3fr 1fr",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span>AI System</span>
                <span>Purpose</span>
                <span>Risk Category</span>
                <span>Your Role</span>
                <span>Data Subjects</span>
                <span>Annex III</span>
              </div>

              {/* Rows */}
              {EXAMPLE_SYSTEMS.map((sys, idx) => (
                <div
                  key={sys.name}
                  className="grid gap-3 px-5 py-4 items-center transition-colors"
                  style={{
                    gridTemplateColumns: "1.6fr 2fr 1.2fr 1.3fr 1.3fr 1fr",
                    borderBottom: idx < EXAMPLE_SYSTEMS.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                    background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#e8f4ff" }}>{sys.name}</p>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded mt-1 inline-block"
                      style={{ color: "#8899aa", background: "rgba(255,255,255,0.04)" }}
                    >
                      {sys.vendor}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "#8899aa" }}>{sys.purpose}</p>
                  <RiskBadge label={sys.risk} color={sys.riskColor} bg={sys.riskBg} />
                  <RoleBadge role={sys.role} />
                  <p className="text-sm" style={{ color: "#8899aa" }}>{sys.dataSubjects}</p>
                  <p className="text-xs font-mono" style={{ color: sys.annexIII === "—" ? "#3d4f60" : "#c9a84c" }}>
                    {sys.annexIII}
                  </p>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-5 mt-5 justify-center">
              {[
                { label: "High Risk — full Annex III obligations", color: "#e05252", bg: "rgba(224,82,82,0.12)" },
                { label: "Limited Risk — transparency obligations only", color: "#2d9cdb", bg: "rgba(45,156,219,0.12)" },
                { label: "Low Risk — no mandatory obligations", color: "#2ecc71", bg: "rgba(46,204,113,0.12)" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: l.color, background: l.bg }}>
                    ●
                  </span>
                  <span className="text-xs" style={{ color: "#8899aa" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Provider vs Deployer ── */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: "#c9a84c" }}>
              Know your role
            </p>
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-serif)", color: "#e8f4ff" }}>
              Provider or deployer — or both?
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: "#8899aa" }}>
              The EU AI Act assigns different obligations depending on your role. Many companies are both — and don&apos;t realise it.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {ROLE_GUIDE.map((r) => {
              const isDeployer = r.role === "Deployer";
              const accent = isDeployer ? "#2d9cdb" : "#8899aa";
              return (
                <div
                  key={r.role}
                  className="rounded-2xl p-6"
                  style={{
                    background: "#0d1520",
                    border: `1px solid ${isDeployer ? "rgba(45,156,219,0.2)" : "rgba(255,255,255,0.07)"}`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="text-sm font-bold px-3 py-1 rounded-full"
                      style={{ color: accent, background: `${accent}18` }}
                    >
                      {r.role}
                    </span>
                  </div>
                  <p className="text-sm mb-4" style={{ color: "#8899aa" }}>{r.definition}</p>
                  <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: "#3d4f60" }}>
                    Key obligations
                  </p>
                  <ul className="space-y-1.5 mb-4">
                    {r.obligations.map((o) => (
                      <li key={o} className="flex items-start gap-2 text-sm" style={{ color: "#8899aa" }}>
                        <span style={{ color: accent }} className="mt-0.5 shrink-0">›</span>
                        {o}
                      </li>
                    ))}
                  </ul>
                  <div
                    className="rounded-lg px-3 py-2 mt-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <p className="text-xs" style={{ color: "#3d4f60" }}>
                      <span style={{ color: "#8899aa" }}>Example: </span>{r.example}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Both note */}
          <div
            className="rounded-xl px-5 py-4 mt-5 flex items-start gap-3"
            style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.18)" }}
          >
            <span className="text-base mt-0.5">⚠️</span>
            <p className="text-sm" style={{ color: "#c9a84c" }}>
              <strong>Many companies are both.</strong> If your team built the AI system and also uses it internally — you are provider and deployer. Both sets of obligations apply.
            </p>
          </div>
        </section>

        {/* ── Download CTA ── */}
        <section
          className="py-20"
          style={{ background: "linear-gradient(135deg, #080c14 0%, #0d1827 50%, #080c14 100%)" }}
        >
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs font-medium"
              style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", color: "#c9a84c" }}
            >
              <Download size={12} />
              Free resource
            </div>

            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-serif)", color: "#e8f4ff" }}
            >
              Start your inventory today.
            </h2>
            <p className="text-base mb-10 max-w-xl mx-auto" style={{ color: "#8899aa", lineHeight: 1.7 }}>
              The compliance deadline is <strong style={{ color: "#e8f4ff" }}>2 August 2026</strong>.
              The inventory is step one — and it&apos;s free. Download the template, map your systems, and you&apos;ll have a foundation that every regulator, investor, and auditor will expect to see.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <DownloadInventoryButton />
              <DownloadInventoryButton example />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              <span className="text-xs" style={{ color: "#3d4f60" }}>Want the full diagnostic?</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>

            {/* LexSutra pitch */}
            <div
              className="rounded-2xl p-8 text-left"
              style={{ background: "#0d1520", border: "1px solid rgba(45,156,219,0.15)" }}
            >
              <div className="flex items-start gap-5">
                <div
                  className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: "rgba(201,168,76,0.12)" }}
                >
                  ⚖️
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-serif)", color: "#e8f4ff" }}>
                    LexSutra turns your inventory into a full compliance diagnostic.
                  </h3>
                  <p className="text-sm mb-4" style={{ color: "#8899aa", lineHeight: 1.7 }}>
                    Once you know what AI systems you have, the next question is: are any of them high-risk under Annex III?
                    LexSutra runs an 80-question diagnostic across all 8 EU AI Act obligation areas and delivers a graded PDF report — colour-coded, legally cited, version-stamped — that you can hand to a regulator, investor, or board.
                  </p>
                  <div className="flex flex-wrap gap-3 mb-5">
                    {["Smart AI Inventory built-in", "Human expert review on every report", "Legal citations included", "Prioritised remediation roadmap", "Policy version-stamped"].map((f) => (
                      <span
                        key={f}
                        className="text-xs px-3 py-1 rounded-full"
                        style={{ background: "rgba(45,156,219,0.08)", color: "#5bb8f0", border: "1px solid rgba(45,156,219,0.18)" }}
                      >
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/#request"
                    className="inline-flex items-center gap-2 btn-gold px-5 py-2.5 text-sm font-semibold rounded-lg"
                  >
                    Request a quote — tell us your context
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer
          className="py-8 text-center text-xs border-t"
          style={{ borderColor: "rgba(255,255,255,0.05)", color: "#3d4f60" }}
        >
          <Link href="/" className="gold-link font-semibold">LexSutra</Link>
          {" "}· EU AI Act Compliance Infrastructure ·{" "}
          <a href="https://lexsutra.com" className="footer-link">lexsutra.com</a>
          <br className="mt-2" />
          <span className="mt-2 block">
            LexSutra provides compliance infrastructure tools, not legal advice.
            This template is for informational purposes only.
          </span>
        </footer>
      </main>
    </div>
  );
}
