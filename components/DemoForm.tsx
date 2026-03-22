"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Download,
  Search,
  BookOpen,
  Layers,
  Scale,
  FileText,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Assessment = {
  overall_risk: string;
  risk_explanation: string;
  top_obligations: string[];
  key_findings: string[];
  confidence: string;
};

type CardData = {
  company: string;
  website: string;
  ref: string;
  date: string;
  assessment: Assessment | null;
};

// ── Email blocking ────────────────────────────────────────────────────────────

const BLOCKED_DOMAINS = new Set([
  // "gmail.com", // TODO: RE-ENABLE BEFORE PRODUCTION DEPLOY
  "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
  "protonmail.com", "aol.com", "mail.com", "live.com", "msn.com",
  "yahoo.co.uk", "googlemail.com", "me.com", "mac.com",
]);

const WHITELISTED_EMAILS = new Set(["kunal@lexsutra.com"]);

function isPersonalEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (WHITELISTED_EMAILS.has(normalized)) return false;
  const domain = normalized.split("@")[1];
  return domain ? BLOCKED_DOMAINS.has(domain) : false;
}

// ── Domain consistency ────────────────────────────────────────────────────────

function extractDomain(value: string): string {
  const v = value.trim().toLowerCase();
  if (!v) return "";
  try {
    if (v.includes("@")) return v.split("@")[1] ?? "";
    const url = new URL(v.startsWith("http") ? v : `https://${v}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function domainsMatch(email: string, website: string): boolean {
  const ed = extractDomain(email);
  const wd = extractDomain(website);
  if (!ed || !wd) return true;
  return ed === wd || ed.endsWith("." + wd) || wd.endsWith("." + ed);
}

// ── Risk styles ───────────────────────────────────────────────────────────────

const RISK_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  "High Risk":        { color: "#e74c4c", bg: "rgba(231,76,76,0.1)",   border: "rgba(231,76,76,0.35)"   },
  "Likely High Risk": { color: "#e08040", bg: "rgba(224,128,64,0.1)",  border: "rgba(224,128,64,0.35)"  },
  "Limited Risk":     { color: "#2d9cdb", bg: "rgba(45,156,219,0.1)",  border: "rgba(45,156,219,0.35)"  },
  "Minimal Risk":     { color: "#2ecc71", bg: "rgba(46,204,113,0.1)",  border: "rgba(46,204,113,0.35)"  },
  "Needs Assessment": { color: "#e0a832", bg: "rgba(224,168,50,0.1)",  border: "rgba(224,168,50,0.35)"  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function genRef(): string {
  return `LS-${new Date().getFullYear()}-${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const MIN_WAIT_MS = 9500; // ensures all loading steps are visible

// ── Loading screen ────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  { Icon: Search,   text: "Scanning your public digital footprint..." },
  { Icon: BookOpen, text: "Consulting 337 pages of EU AI Act legislation..." },
  { Icon: Layers,   text: "Mapping your AI system to Annex III categories..." },
  { Icon: Scale,    text: "Cross-referencing 8 obligation areas..." },
  { Icon: FileText, text: "Compiling your preliminary findings..." },
];
const STEP_MS = 2000;

function AnalysisLoader() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = LOADING_STEPS.slice(1).map((_, i) =>
      setTimeout(() => setStep(i + 1), (i + 1) * STEP_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const progress = Math.round(((step + 1) / LOADING_STEPS.length) * 100);

  return (
    <div className="py-6 space-y-5">
      {/* Title */}
      <div className="text-center space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#c9a84c" }}
          />
          <span
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "#c9a84c" }}
          >
            Analysis in progress
          </span>
          <div
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#c9a84c", animationDelay: "0.3s" }}
          />
        </div>
        <p className="text-xs" style={{ color: "#3d4f60" }}>
          We take compliance seriously. This takes a moment.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-1.5">
        {LOADING_STEPS.map(({ Icon, text }, idx) => {
          const done    = idx < step;
          const active  = idx === step;
          const pending = idx > step;

          return (
            <div
              key={idx}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-700"
              style={{
                background: active ? "rgba(201,168,75,0.07)" : "transparent",
                border:     active
                  ? "1px solid rgba(201,168,75,0.18)"
                  : "1px solid transparent",
                opacity: pending ? 0.22 : 1,
              }}
            >
              {/* Icon dot */}
              <div
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full"
                style={{
                  background: done
                    ? "rgba(46,204,113,0.15)"
                    : active
                    ? "rgba(201,168,75,0.15)"
                    : "rgba(255,255,255,0.04)",
                }}
              >
                {done ? (
                  <CheckCircle className="w-3.5 h-3.5" style={{ color: "#2ecc71" }} />
                ) : (
                  <Icon
                    className="w-3 h-3"
                    style={{ color: active ? "#c9a84c" : "#3d4f60" }}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className="text-sm flex-1"
                style={{
                  color: done ? "#4caf7c" : active ? "#e8f4ff" : "#3d4f60",
                }}
              >
                {text}
              </span>

              {/* Active pulse dots */}
              {active && (
                <div className="flex gap-0.5 shrink-0">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1 h-1 rounded-full animate-pulse"
                      style={{
                        background: "#c9a84c",
                        animationDelay: `${i * 0.25}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div
        className="h-px rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #c9a84c, #e8d5a0)",
            width: `${progress}%`,
            transition: `width ${STEP_MS}ms ease-out`,
          }}
        />
      </div>

      <p className="text-center text-xs italic" style={{ color: "#3d4f60" }}>
        Good compliance analysis isn&apos;t instant — and that&apos;s the point.
      </p>
    </div>
  );
}

// ── Compliance card ───────────────────────────────────────────────────────────

function ComplianceCard({ id, data }: { id: string; data: CardData }) {
  const { assessment } = data;
  const risk = assessment
    ? (RISK_STYLE[assessment.overall_risk] ?? RISK_STYLE["Needs Assessment"])
    : null;

  return (
    <div
      id={id}
      style={{
        background: "linear-gradient(145deg, #0d1520 0%, #080c14 100%)",
        border: "1px solid rgba(201,168,75,0.45)",
        borderRadius: 12,
        padding: "20px 22px",
        maxWidth: 340,
        margin: "0 auto",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{
              color: "#c9a84c",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            LexSutra
          </div>
          <div
            style={{
              color: "#3d4f60",
              fontSize: 9,
              letterSpacing: "0.06em",
              marginTop: 2,
              textTransform: "uppercase",
            }}
          >
            EU AI Act · Compliance Profile
          </div>
        </div>
        <div
          style={{
            background: "rgba(201,168,75,0.1)",
            border: "1px solid rgba(201,168,75,0.3)",
            borderRadius: 4,
            padding: "3px 8px",
          }}
        >
          <span
            style={{
              color: "#c9a84c",
              fontSize: 8.5,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            DIAGNOSTIC
          </span>
        </div>
      </div>

      {/* Gold rule */}
      <div
        style={{
          height: 1,
          background:
            "linear-gradient(90deg, rgba(201,168,75,0.6) 0%, rgba(201,168,75,0.04) 100%)",
          marginBottom: 14,
        }}
      />

      {/* Company */}
      <div style={{ marginBottom: 13 }}>
        <div
          style={{
            color: "#e8f4ff",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "0.01em",
            lineHeight: 1.25,
            marginBottom: 3,
          }}
        >
          {data.company}
        </div>
        <div style={{ color: "#3d4f60", fontSize: 10 }}>{data.website}</div>
      </div>

      {/* Risk / status box */}
      {assessment && risk ? (
        <div
          style={{
            background: risk.bg,
            border: `1px solid ${risk.border}`,
            borderRadius: 7,
            padding: "9px 11px",
            marginBottom: 13,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 5,
            }}
          >
            <span
              style={{
                color: risk.color,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {assessment.overall_risk}
            </span>
            <span
              style={{
                color: "#3d4f60",
                fontSize: 8,
                background: "rgba(255,255,255,0.06)",
                padding: "2px 6px",
                borderRadius: 3,
                letterSpacing: "0.05em",
              }}
            >
              {assessment.confidence} confidence
            </span>
          </div>
          <div style={{ color: "#8899aa", fontSize: 9, lineHeight: 1.55 }}>
            {assessment.risk_explanation}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "rgba(45,156,219,0.07)",
            border: "1px solid rgba(45,156,219,0.2)",
            borderRadius: 7,
            padding: "9px 11px",
            marginBottom: 13,
          }}
        >
          <span
            style={{
              color: "#2d9cdb",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Assessment Requested
          </span>
          <div style={{ color: "#8899aa", fontSize: 9, marginTop: 4, lineHeight: 1.55 }}>
            Our team will review your AI footprint and respond within 24 hours.
          </div>
        </div>
      )}

      {/* Key findings — real data */}
      {assessment && risk && (
        <div style={{ marginBottom: 13 }}>
          <div
            style={{
              color: "#3d4f60",
              fontSize: 8,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 7,
            }}
          >
            Key Findings
          </div>
          {assessment.key_findings.slice(0, 2).map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 6,
                marginBottom: 5,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: risk.color,
                  marginTop: 4,
                  flexShrink: 0,
                }}
              />
              <span
                style={{ color: "#8899aa", fontSize: 9, lineHeight: 1.5 }}
              >
                {f}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Obligations */}
      <div style={{ marginBottom: 13 }}>
        {assessment
          ? assessment.top_obligations.slice(0, 3).map((ob, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "4px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span style={{ color: "#8899aa", fontSize: 9 }}>{ob}</span>
                <span
                  style={{
                    color: risk!.color,
                    fontSize: 8,
                    background: risk!.bg,
                    border: `1px solid ${risk!.border}`,
                    padding: "1px 6px",
                    borderRadius: 3,
                  }}
                >
                  Review
                </span>
              </div>
            ))
          : ["Risk Management (Art. 9)", "Data Governance (Art. 10)", "Transparency (Art. 13)"].map(
              (ob) => (
                <div
                  key={ob}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "4px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span style={{ color: "#8899aa", fontSize: 9 }}>{ob}</span>
                  <span
                    style={{
                      color: "#3d4f60",
                      fontSize: 8,
                      background: "rgba(255,255,255,0.05)",
                      padding: "1px 6px",
                      borderRadius: 3,
                    }}
                  >
                    Pending
                  </span>
                </div>
              )
            )}
      </div>

      {/* Disclaimer */}
      <div
        style={{
          color: "#3d4f60",
          fontSize: 7.5,
          fontStyle: "italic",
          marginBottom: 12,
          lineHeight: 1.55,
        }}
      >
        Based on publicly available information only. Full diagnostic required
        for compliance purposes.
      </div>

      {/* Ref + date */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 11,
        }}
      >
        <span style={{ color: "#3d4f60", fontSize: 8.5 }}>
          Ref: {data.ref}
        </span>
        <span style={{ color: "#3d4f60", fontSize: 8.5 }}>{data.date}</span>
      </div>

      {/* Footer */}
      <div
        style={{
          height: 1,
          background: "rgba(255,255,255,0.06)",
          marginBottom: 9,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: "#3d4f60", fontSize: 8.5 }}>lexsutra.com</span>
        <span
          style={{
            color: "#3d4f60",
            fontSize: 8,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Deadline: Aug 2, 2026
        </span>
      </div>
    </div>
  );
}

function downloadCard(cardId: string) {
  const card = document.getElementById(cardId);
  if (!card) return;
  const win = window.open("", "_blank", "width=440,height=660");
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>LexSutra Compliance Card</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #060a14; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    @media print { @page { size: 3.4in 5.2in; margin: 0; } body { min-height: unset; padding: 12px; } }
  </style>
</head>
<body>${card.outerHTML}</body>
</html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

// ── Input style ───────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-4 py-3 rounded-lg border bg-[#060a14] text-white placeholder-[#3d4f60] " +
  "border-white/10 focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 " +
  "focus:ring-[#c9a84c]/25 transition disabled:opacity-50 text-sm";

// ── Main component ────────────────────────────────────────────────────────────

export function DemoForm() {
  const [form, setForm] = useState({
    company_name: "",
    email: "",
    website_url: "",
  });
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [domainMismatch, setDomainMismatch] = useState(false);
  const [cardData, setCardData] = useState<CardData | null>(null);

  function checkDomainMismatch(email: string, website: string) {
    if (email && website && !isPersonalEmail(email)) {
      setDomainMismatch(!domainsMatch(email, website));
    } else {
      setDomainMismatch(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = { ...form, [e.target.name]: e.target.value };
    setForm(next);
    if (error) setError("");
    checkDomainMismatch(next.email, next.website_url);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (
      !form.company_name.trim() ||
      !form.email.trim() ||
      !form.website_url.trim()
    ) {
      setError("All fields are required.");
      return;
    }
    if (isPersonalEmail(form.email)) {
      setError(
        "Please use your business email address. Personal email providers are not accepted."
      );
      return;
    }

    setStatus("submitting");

    try {
      // Run API call and minimum display timer in parallel
      const [res] = await Promise.all([
        fetch("/api/demo-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_name: form.company_name.trim(),
            email: form.email.trim().toLowerCase(),
            website_url: form.website_url.trim(),
          }),
        }),
        new Promise((resolve) => setTimeout(resolve, MIN_WAIT_MS)),
      ]);

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();

      setCardData({
        company: form.company_name.trim(),
        website: form.website_url
          .trim()
          .replace(/^https?:\/\/(www\.)?/, "")
          .replace(/\/$/, ""),
        ref: genRef(),
        date: fmtDate(new Date()),
        assessment: data.assessment ?? null,
      });
      setStatus("success");
    } catch {
      setStatus("error");
      setError(
        "Something went wrong. Please try again or email us at hello@send.lexsutra.com."
      );
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  if (status === "submitting") {
    return <AnalysisLoader />;
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (status === "success" && cardData) {
    return (
      <div className="space-y-6">
        {/* Confirmation */}
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
            style={{
              background: "rgba(76,175,124,0.15)",
              border: "1px solid rgba(76,175,124,0.3)",
            }}
          >
            <CheckCircle className="w-7 h-7" style={{ color: "#4caf7c" }} />
          </div>
          <h3 className="text-xl font-serif font-semibold text-white mb-2">
            {cardData.assessment ? "Your preliminary assessment is ready" : "Request received"}
          </h3>
          <p className="text-sm max-w-xs mx-auto" style={{ color: "#8899aa" }}>
            {cardData.assessment
              ? "Based on your public footprint. Our team will follow up within 24 hours — we've also sent this to your email."
              : "Our team will review your details and send you a compliance snapshot within 24 hours."}
          </p>
        </div>

        {/* Card */}
        <div>
          <p
            className="text-xs text-center mb-3"
            style={{ color: "#3d4f60" }}
          >
            Share this with your team
          </p>
          <ComplianceCard id="lexsutra-compliance-card" data={cardData} />
          <button
            onClick={() => downloadCard("lexsutra-compliance-card")}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: "rgba(201,168,75,0.07)",
              border: "1px solid rgba(201,168,75,0.25)",
              color: "#c9a84c",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(201,168,75,0.14)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(201,168,75,0.07)";
            }}
          >
            <Download className="w-4 h-4" />
            Download Compliance Card
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          className="block text-xs font-medium mb-1.5"
          style={{ color: "#8899aa" }}
        >
          Company name
        </label>
        <input
          type="text"
          name="company_name"
          value={form.company_name}
          onChange={handleChange}
          placeholder="Acme AI GmbH"
          className={inputClass}
          autoComplete="organization"
        />
      </div>

      <div>
        <label
          className="block text-xs font-medium mb-1.5"
          style={{ color: "#8899aa" }}
        >
          Business email
        </label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@company.com"
          className={inputClass}
          autoComplete="email"
        />
        <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>
          Personal email providers (Gmail, Outlook, etc.) are not accepted.
        </p>
      </div>

      <div>
        <label
          className="block text-xs font-medium mb-1.5"
          style={{ color: "#8899aa" }}
        >
          Company website
        </label>
        <input
          type="url"
          name="website_url"
          value={form.website_url}
          onChange={handleChange}
          placeholder="https://company.com"
          className={inputClass}
          autoComplete="url"
        />
      </div>

      {domainMismatch && (
        <div
          className="flex items-start gap-2.5 p-3 rounded-lg"
          style={{
            background: "rgba(224,168,50,0.07)",
            border: "1px solid rgba(224,168,50,0.2)",
          }}
        >
          <AlertTriangle
            className="w-4 h-4 mt-0.5 shrink-0"
            style={{ color: "#e0a832" }}
          />
          <p className="text-sm" style={{ color: "#e0a832" }}>
            Your email domain doesn&apos;t match your website — please
            double-check these belong to the same company. You can still submit.
          </p>
        </div>
      )}

      {error && (
        <div
          className="flex items-start gap-2.5 p-3.5 rounded-lg"
          style={{
            background: "rgba(231,76,76,0.08)",
            border: "1px solid rgba(231,76,76,0.2)",
          }}
        >
          <AlertCircle
            className="w-4 h-4 mt-0.5 shrink-0"
            style={{ color: "#e74c4c" }}
          />
          <p className="text-sm" style={{ color: "#e74c4c" }}>
            {error}
          </p>
        </div>
      )}

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm transition-colors"
        style={{ background: "#c9a84c", color: "#060a14" }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.background = "#dbbf6a";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.background = "#c9a84c";
        }}
      >
        Analyse My Company
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="text-center text-xs" style={{ color: "#3d4f60" }}>
        No account needed &middot; No spam &middot; Results within 24 hours
      </p>
    </form>
  );
}
