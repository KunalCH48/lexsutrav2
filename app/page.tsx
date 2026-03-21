import {
  Shield,
  Database,
  FileText,
  Activity,
  Eye,
  Users,
  TrendingUp,
  Award,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  Scale,
  FileCheck,
  Lock,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Countdown } from "@/components/Countdown";
import { DemoForm } from "@/components/DemoForm";
import RegulatoryFeedSection from "@/components/RegulatoryFeedSection";

// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center"
      style={{
        background: "rgba(6,10,20,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center">
          <span className="text-xl font-serif font-semibold select-none">
            <span style={{ color: "#c9a84c" }}>Lex</span>
            <span className="text-white">Sutra</span>
          </span>
        </a>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "How It Works",       href: "#how-it-works" },
            { label: "Obligations",        href: "#obligations" },
            { label: "Pricing",            href: "#pricing" },
            { label: "Regulatory Updates", href: "/regulatory-updates" },
          ].map(({ label, href }) => (
            <a key={label} href={href} className="nav-link text-sm">
              {label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a href="#request" className="btn-gold px-4 py-2 text-sm font-semibold rounded-md">
          Free Snapshot
        </a>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────
function MockReport() {
  const items = [
    { name: "Risk Management",  grade: "C+", rag: "amber" },
    { name: "Data Governance",  grade: "D",  rag: "red"   },
    { name: "Documentation",    grade: "B+", rag: "green" },
    { name: "Logging",          grade: "C",  rag: "amber" },
    { name: "Transparency",     grade: "B",  rag: "green" },
    { name: "Human Oversight",  grade: "D+", rag: "red"   },
    { name: "Accuracy",         grade: "B-", rag: "green" },
    { name: "Conformity",       grade: "F",  rag: "red"   },
  ];

  const rag = {
    red:   { dot: "#e74c4c", badge: "rgba(231,76,76,0.12)",  text: "#e74c4c",  border: "rgba(231,76,76,0.25)"  },
    amber: { dot: "#e8a735", badge: "rgba(232,167,53,0.12)", text: "#e8a735",  border: "rgba(232,167,53,0.25)" },
    green: { dot: "#4caf7c", badge: "rgba(76,175,124,0.12)", text: "#4caf7c",  border: "rgba(76,175,124,0.25)" },
  };

  return (
    <div className="relative">
      <div
        className="absolute inset-0 rounded-2xl blur-2xl"
        style={{ background: "rgba(201,168,76,0.06)" }}
      />
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0d1827", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div>
            <div
              className="text-[10px] font-semibold tracking-widest mb-0.5"
              style={{ color: "#c9a84c" }}
            >
              LEXSUTRA DIAGNOSTIC REPORT
            </div>
            <div className="text-white font-semibold text-sm">
              Sample AI Hiring System · v2.1
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#4a5568" }}>
              Stamped: EU AI Act 2024/1689
            </div>
          </div>
          <div className="text-right">
            <div
              className="text-4xl font-serif font-bold"
              style={{ color: "#e8a735" }}
            >
              C+
            </div>
            <div className="text-xs" style={{ color: "#8899aa" }}>
              Overall Grade
            </div>
          </div>
        </div>

        {/* Scores */}
        <div className="px-6 py-4 space-y-2.5">
          {items.map((item) => {
            const r = rag[item.rag as keyof typeof rag];
            return (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: r.dot }}
                />
                <div className="flex-1 text-xs" style={{ color: "#8899aa" }}>
                  {item.name}
                </div>
                <div
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{
                    background: r.badge,
                    color: r.text,
                    border: `1px solid ${r.border}`,
                  }}
                >
                  {item.grade}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 flex items-center justify-between"
          style={{
            background: "rgba(6,10,20,0.6)",
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <span className="text-[10px]" style={{ color: "#3d4f60" }}>
            Human reviewed ✓
          </span>
          <span className="text-[10px]" style={{ color: "#3d4f60" }}>
            Remediation roadmap included
          </span>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative pt-28 pb-20 px-6 min-h-screen flex items-center overflow-hidden">
      {/* Radial glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left */}
        <div className="animate-fade-up">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
            style={{
              border: "1px solid rgba(201,168,76,0.3)",
              background: "rgba(201,168,76,0.08)",
              color: "#dbbf6a",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#c9a84c" }}
            />
            EU AI Act · August 2026 Compliance Deadline
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-semibold leading-[1.1] text-white mb-6">
            A compliance inspection
            <br />
            for your{" "}
            <span className="gold-shimmer">AI system.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg leading-relaxed mb-10 max-w-xl" style={{ color: "#8899aa" }}>
            Like a professional house inspection — but for AI. We assess your system
            against EU AI Act obligations, produce a graded diagnostic report with
            legal citations, and give you a prioritised remediation roadmap.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <a
              href="#request"
              className="btn-gold inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm"
            >
              Get Free Snapshot
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#how-it-works"
              className="btn-outline-dark inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm"
            >
              See How It Works
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Stats */}
          <div
            className="flex items-center gap-6 pt-8"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            {[
              { n: "8",   label: "Obligations assessed" },
              { n: "80+", label: "Diagnostic questions" },
              { n: "10",  label: "Days to delivery" },
            ].map(({ n, label }, i) => (
              <div key={label} className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{n}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#8899aa" }}>
                    {label}
                  </div>
                </div>
                {i < 2 && (
                  <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.06)" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right — mock report */}
        <div className="hidden lg:block animate-fade-up delay-200">
          <MockReport />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// URGENCY BANNER
// ─────────────────────────────────────────────────────────────────────────────
function UrgencyBanner() {
  return (
    <section
      className="relative z-10"
      style={{
        background: "#0a1120",
        borderTop: "1px solid rgba(201,168,76,0.1)",
        borderBottom: "1px solid rgba(201,168,76,0.1)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-7 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#e74c4c" }}
          />
          <div>
            <div
              className="text-[10px] uppercase tracking-widest font-semibold"
              style={{ color: "#8899aa" }}
            >
              EU AI Act High-Risk Compliance Deadline
            </div>
            <div className="text-white font-semibold text-sm">August 2, 2026</div>
          </div>
        </div>

        <Countdown />

        <a
          href="#request"
          className="text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
          style={{ color: "#c9a84c" }}
        >
          Get your free snapshot <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIFFERENTIATION
// ─────────────────────────────────────────────────────────────────────────────
function Differentiation() {
  const features = [
    {
      icon: Scale,
      title: "Legally cited",
      desc: "Every finding is referenced to specific EU AI Act articles. No vague summaries — citations your legal team can verify.",
    },
    {
      icon: Lock,
      title: "Version-stamped",
      desc: "Your report is permanently tied to the exact regulation version at time of assessment. Defensible forever.",
    },
    {
      icon: Users,
      title: "Human-reviewed",
      desc: "Every diagnostic is reviewed by a qualified expert before delivery. AI drafts, humans verify. That's the standard.",
    },
    {
      icon: FileCheck,
      title: "Audit-ready",
      desc: "Structured for regulatory inspection. Not a summary document — a compliance instrument with legal weight.",
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "#c9a84c" }}
          >
            What makes us different
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-semibold text-white mb-6 leading-tight">
            Not a chatbot.
            <br />A defensible document.
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#8899aa" }}>
            ChatGPT gives a conversation. LexSutra gives a legally cited, version-stamped,
            human-reviewed, audit-ready compliance report.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group p-6 rounded-xl card-hover"
              style={{
                background: "#0d1827",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.2)",
                }}
              >
                <Icon className="w-5 h-5" style={{ color: "#c9a84c" }} />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#8899aa" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCESS
// ─────────────────────────────────────────────────────────────────────────────
function Process() {
  const steps = [
    {
      n: "01",
      icon: TrendingUp,
      title: "Pre-Scan",
      desc: "We scan your AI system's public digital footprint — website, documentation, app stores — to build an initial risk and obligation profile.",
      duration: "Day 1–2",
    },
    {
      n: "02",
      icon: FileText,
      title: "Assessment",
      desc: "80+ structured questions across all 8 EU AI Act obligation areas. You complete the questionnaire; we analyse every response.",
      duration: "Day 3–5",
    },
    {
      n: "03",
      icon: Users,
      title: "AI + Human Review",
      desc: "Claude AI drafts the findings. A qualified compliance expert reviews, adjusts, and validates every clause before the report is finalised.",
      duration: "Day 6–8",
    },
    {
      n: "04",
      icon: Award,
      title: "Report Delivery",
      desc: "Your graded PDF diagnostic report — colour-coded by obligation, legally cited, version-stamped, with a prioritised remediation roadmap.",
      duration: "Day 9–10",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-24 px-6"
      style={{ background: "#0a1120" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "#c9a84c" }}
          >
            The process
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-white">
            How a diagnostic works
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 relative">
          {/* Connecting line (desktop) */}
          <div
            className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(201,168,76,0.2) 20%, rgba(201,168,76,0.2) 80%, transparent)",
            }}
          />

          {steps.map(({ n, icon: Icon, title, desc, duration }) => (
            <div key={n} className="relative">
              {/* Circle + icon */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: "#0d1827",
                    border: "2px solid rgba(201,168,76,0.35)",
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: "#c9a84c" }} />
                </div>
                <div
                  className="text-4xl font-serif font-bold leading-none select-none"
                  style={{ color: "rgba(255,255,255,0.04)" }}
                >
                  {n}
                </div>
              </div>

              <div
                className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded mb-3"
                style={{
                  background: "rgba(201,168,76,0.1)",
                  color: "rgba(201,168,76,0.7)",
                }}
              >
                {duration}
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#8899aa" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OBLIGATIONS
// ─────────────────────────────────────────────────────────────────────────────
function Obligations() {
  const items = [
    {
      icon: Shield,
      article: "Art. 9",
      name: "Risk Management System",
      desc: "Continuous identification, analysis, and mitigation of risks throughout the AI system lifecycle.",
    },
    {
      icon: Database,
      article: "Art. 10",
      name: "Data Governance",
      desc: "Training, validation, and testing data quality. Bias examination and data management practices.",
    },
    {
      icon: FileText,
      article: "Art. 11 & Annex IV",
      name: "Technical Documentation",
      desc: "Complete technical file before market placement — architecture, capabilities, limitations, intended purpose.",
    },
    {
      icon: Activity,
      article: "Art. 12",
      name: "Logging & Record Keeping",
      desc: "Automatic event logging to enable post-market monitoring, investigation, and regulatory audit.",
    },
    {
      icon: Eye,
      article: "Art. 13",
      name: "Transparency",
      desc: "Clear disclosure of AI capabilities, limitations, and intended purpose to deployers and end users.",
    },
    {
      icon: Users,
      article: "Art. 14",
      name: "Human Oversight",
      desc: "Built-in mechanisms enabling human supervision, intervention, and override of AI outputs.",
    },
    {
      icon: TrendingUp,
      article: "Art. 15",
      name: "Accuracy & Robustness",
      desc: "Performance levels, cybersecurity resilience, and continuity of operation under adverse conditions.",
    },
    {
      icon: Award,
      article: "Art. 43 & Annex VI/VII",
      name: "Conformity Assessment",
      desc: "Third-party or self-assessment procedures required before CE marking and market placement.",
    },
  ];

  return (
    <section id="obligations" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "#c9a84c" }}
          >
            The EU AI Act framework
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-white mb-4">
            The 8 obligations we diagnose
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: "#8899aa" }}>
            Every high-risk AI system must comply with all 8 areas. We assess each one
            and tell you exactly where you stand — with legal citations.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map(({ icon: Icon, article, name, desc }) => (
            <div
              key={name}
              className="group p-5 rounded-xl card-hover"
              style={{
                background: "#0d1827",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(201,168,76,0.1)" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#c9a84c" }} />
                </div>
                <span
                  className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded"
                  style={{
                    background: "rgba(201,168,76,0.07)",
                    color: "rgba(201,168,76,0.6)",
                  }}
                >
                  {article}
                </span>
              </div>
              <h3 className="text-white font-semibold text-sm mb-2 leading-snug">
                {name}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "#8899aa" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICING
// ─────────────────────────────────────────────────────────────────────────────
function Pricing() {
  const plans = [
    {
      name: "Starter",
      badge: null,
      desc: "Public footprint assessment — your AI system's first compliance snapshot.",
      features: [
        "Public Footprint Pre-Scan",
        "AI system risk classification",
        "Initial obligation gap summary",
        "PDF snapshot report",
      ],
      featured: false,
    },
    {
      name: "Core",
      badge: "MOST POPULAR",
      desc: "The full diagnostic — the definitive EU AI Act assessment for high-risk systems.",
      features: [
        "Everything in Starter",
        "Full 80+ question diagnostic",
        "All 8 EU AI Act obligations assessed",
        "Graded PDF report with legal citations",
        "Compliance scorecard",
        "Prioritised remediation roadmap",
        "Human expert review before delivery",
        "Policy version stamp",
      ],
      featured: true,
    },
    {
      name: "Premium",
      badge: null,
      desc: "For teams preparing for investment, audit, or market launch.",
      features: [
        "Everything in Core",
        "1-hour strategy session with expert",
        "Investor-grade compliance certificate",
        "30-day regulatory Q&A support",
      ],
      featured: false,
    },
  ];

  return (
    <section
      id="pricing"
      className="py-24 px-6"
      style={{ background: "#0a1120" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "#c9a84c" }}
          >
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-white mb-4">
            Priced to your context.
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: "#8899aa" }}>
            Every AI system is different. So is every quote. Tell us what you have
            and we&apos;ll come back with a number that makes sense for your situation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map(({ name, badge, desc, features, featured }) => (
            <div
              key={name}
              className="relative rounded-2xl p-8"
              style={{
                background: "#0d1827",
                border: featured
                  ? "2px solid rgba(201,168,76,0.4)"
                  : "1px solid rgba(255,255,255,0.05)",
                boxShadow: featured ? "0 0 60px rgba(201,168,76,0.07)" : "none",
              }}
            >
              {badge && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold tracking-wider"
                  style={{ background: "#c9a84c", color: "#060a14" }}
                >
                  {badge}
                </div>
              )}

              <div className="mb-6">
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ color: featured ? "#dbbf6a" : "#e2e8f0" }}
                >
                  {name}
                </h3>
                <p className="text-sm" style={{ color: "#8899aa" }}>{desc}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckCircle
                      className="w-4 h-4 mt-0.5 shrink-0"
                      style={{ color: featured ? "#c9a84c" : "#4caf7c" }}
                    />
                    <span className="text-sm" style={{ color: "#8899aa" }}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="/ai-inventory"
                className={`block text-center py-3 px-6 rounded-lg font-semibold text-sm ${
                  featured ? "btn-gold" : "btn-pricing-secondary"
                }`}
              >
                Request a Quote →
              </a>
            </div>
          ))}
        </div>

        {/* Context note */}
        <div
          className="mt-10 text-center py-5 px-6 rounded-xl"
          style={{
            background: "rgba(201,168,76,0.05)",
            border: "1px solid rgba(201,168,76,0.12)",
          }}
        >
          <p className="text-sm mb-1" style={{ color: "#dbbf6a" }}>
            <strong>Not sure which tier fits?</strong>
          </p>
          <p className="text-sm" style={{ color: "#8899aa" }}>
            Start by building your AI system inventory — it&apos;s free, and it&apos;s the first thing
            we&apos;ll need to give you an accurate quote.{" "}
            <a
              href="/ai-inventory"
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
              style={{ color: "#dbbf6a" }}
            >
              Get the free template →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────────────────────────────────────
type Testimonial = {
  id: string;
  feedback_text: string;
  rating_experience: number;
  rating_usefulness: number;
  rating_value_for_money: number;
  display_name: string | null;
  display_role: string | null;
  display_company: string | null;
};

// Placeholder cards shown until real testimonials are approved
const PLACEHOLDERS: Omit<Testimonial, "id">[] = [
  {
    feedback_text:          "The diagnostic gave us a clear, defensible picture of where we stood against the EU AI Act. The legal citations meant our counsel could verify every finding directly. Worth every euro.",
    rating_experience:      5,
    rating_usefulness:      5,
    rating_value_for_money: 5,
    display_name:           "Founding Client",
    display_role:           "CTO",
    display_company:        "HR Tech Startup",
  },
  {
    feedback_text:          "We tried using ChatGPT for compliance advice and got vague answers. LexSutra gave us a graded report with article references we could actually act on. The remediation roadmap alone saved us weeks.",
    rating_experience:      5,
    rating_usefulness:      5,
    rating_value_for_money: 5,
    display_name:           "Founding Client",
    display_role:           "CEO",
    display_company:        "Fintech Scale-up",
  },
  {
    feedback_text:          "The human review step made the difference. We had an edge case in our training data that an automated tool would have missed. LexSutra caught it and flagged it with the exact Article 10 reference.",
    rating_experience:      5,
    rating_usefulness:      5,
    rating_value_for_money: 5,
    display_name:           "Founding Client",
    display_role:           "Head of Product",
    display_company:        "AI Infrastructure Company",
  },
];

async function Testimonials() {
  let testimonials: Testimonial[] = [];
  const isPlaceholder = { value: false };

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data } = await supabase
      .from("client_feedback")
      .select("id, feedback_text, rating_experience, rating_usefulness, rating_value_for_money, display_name, display_role, display_company")
      .eq("testimonial_approved", true)
      .eq("can_use_as_testimonial", true)
      .order("created_at", { ascending: false })
      .limit(3);

    testimonials = (data ?? []) as Testimonial[];
  } catch {
    // Fall through to placeholders
  }

  if (testimonials.length === 0) {
    isPlaceholder.value = true;
    testimonials = PLACEHOLDERS.map((p, i) => ({ ...p, id: String(i) }));
  }

  return (
    <section className="py-24 px-6" style={{ background: "#0a1120" }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#c9a84c" }}>
            Client results
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-white mb-4">
            From the founders who went first
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: "#8899aa" }}>
            What AI startup founders say after receiving their LexSutra diagnostic report.
          </p>
          {isPlaceholder.value && (
            <p className="text-xs mt-3 italic" style={{ color: "#3d4f60" }}>
              Testimonials from our founding clients — coming soon.
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl p-7 flex flex-col"
              style={{
                background: "#0d1827",
                border:     "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Stars — average of 3 ratings */}
              <div className="flex gap-0.5 mb-5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const avg = Math.round((t.rating_experience + t.rating_usefulness + t.rating_value_for_money) / 3);
                  return (
                    <span
                      key={star}
                      className="text-base"
                      style={{ color: star <= avg ? "#c9a84c" : "rgba(255,255,255,0.1)" }}
                    >
                      ★
                    </span>
                  );
                })}
              </div>

              {/* Quote */}
              <blockquote
                className="text-sm leading-relaxed flex-1 mb-6"
                style={{ color: "#8899aa" }}
              >
                &ldquo;{t.feedback_text}&rdquo;
              </blockquote>

              {/* Attribution */}
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c" }}
                >
                  {t.display_name?.[0] ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#e8f4ff" }}>
                    {t.display_name ?? "Anonymous"}
                    {t.display_role && (
                      <span style={{ color: "#3d4f60" }}> · {t.display_role}</span>
                    )}
                  </p>
                  {t.display_company && (
                    <p className="text-xs mt-0.5" style={{ color: "#3d4f60" }}>
                      {t.display_company}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMO FORM SECTION
// ─────────────────────────────────────────────────────────────────────────────
function DemoCTASection() {
  return (
    <section id="request" className="py-24 px-6">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-4"
            style={{ color: "#c9a84c" }}
          >
            Free first step
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-white mb-4">
            See where you stand — free
          </h2>
          <p style={{ color: "#8899aa" }}>
            Share your company details. We&apos;ll analyse your AI system&apos;s
            public footprint and send you 5 concrete EU AI Act compliance
            insights within 24&nbsp;hours. No questionnaire. No commitment.
          </p>
        </div>

        <div
          className="rounded-2xl p-8 md:p-10"
          style={{
            background: "#0d1827",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <DemoForm />
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#3d4f60" }}>
          LexSutra provides compliance infrastructure tools, not legal advice.
          By submitting you agree to our{" "}
          <a href="/privacy" className="underline hover:opacity-80">
            Privacy Policy
          </a>
          {" "}and{" "}
          <a href="/terms" className="underline hover:opacity-80">
            Terms & Conditions
          </a>
          .
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      className="py-16 px-6"
      style={{
        background: "#060a14",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Logo + tagline */}
          <div className="md:col-span-2">
            <div className="text-2xl font-serif font-semibold mb-3">
              <span style={{ color: "#c9a84c" }}>Lex</span>
              <span className="text-white">Sutra</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs mb-5" style={{ color: "#8899aa" }}>
              The guiding thread through EU AI Act compliance. A diagnostic report
              your lawyers, investors, and regulators can rely on.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link text-sm"
              >
                LinkedIn
              </a>
              <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
              <a
                href="mailto:hello@send.lexsutra.com"
                className="footer-link text-sm"
              >
                hello@send.lexsutra.com
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { label: "How It Works", href: "#how-it-works" },
                { label: "Obligations",  href: "#obligations" },
                { label: "Pricing",      href: "#pricing" },
                { label: "Free Snapshot",      href: "#request" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="footer-link text-sm">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Privacy Policy",  href: "/privacy" },
                { label: "Terms & Conditions", href: "/terms" },
                { label: "AI Inventory Template", href: "/ai-inventory" },
                { label: "Data Processing Agreement", href: "https://anthropic.com/legal/data-processing-addendum" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="footer-link text-sm" target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <p className="text-xs" style={{ color: "#3d4f60" }}>
            © 2026 LexSutra · lexsutra.com · All rights reserved.
          </p>
          <p className="text-xs text-center md:text-right max-w-md" style={{ color: "#3d4f60" }}>
            LexSutra provides compliance infrastructure tools only. Nothing on this
            platform constitutes legal advice. Engage qualified legal counsel for legal
            decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "#060a14" }}>
      <Navbar />
      <main>
        <Hero />
        <UrgencyBanner />
        <Differentiation />
        <Process />
        <Obligations />
        <RegulatoryFeedSection />
        <Pricing />
        <Testimonials />
        <DemoCTASection />
      </main>
      <Footer />
    </div>
  );
}
