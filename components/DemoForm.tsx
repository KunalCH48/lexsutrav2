"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, AlertCircle, AlertTriangle, Download } from "lucide-react";

const BLOCKED_DOMAINS = new Set([
  // "gmail.com", // TODO: REMOVE THIS COMMENT AND RE-ENABLE BEFORE PRODUCTION DEPLOY
  //              // gmail.com is temporarily allowed for internal testing — must be blocked for launch
  "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
  "protonmail.com", "aol.com", "mail.com", "live.com", "msn.com",
  "yahoo.co.uk", "googlemail.com", "me.com", "mac.com",
]);

const WHITELISTED_EMAILS = new Set(["kunal.lexutra@gmail.com"]);

function isPersonalEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (WHITELISTED_EMAILS.has(normalized)) return false;
  const domain = normalized.split("@")[1];
  return domain ? BLOCKED_DOMAINS.has(domain) : false;
}

// ── Domain consistency helpers ────────────────────────────────────────────────

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
  const emailDomain = extractDomain(email);
  const websiteDomain = extractDomain(website);
  if (!emailDomain || !websiteDomain) return true; // can't determine — don't warn
  return (
    emailDomain === websiteDomain ||
    emailDomain.endsWith("." + websiteDomain) ||
    websiteDomain.endsWith("." + emailDomain)
  );
}

// ── Compliance card helpers ───────────────────────────────────────────────────

function genRef(): string {
  return `LS-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

type CardData = { company: string; website: string; ref: string; date: string };

function ComplianceCard({ id, data }: { id: string; data: CardData }) {
  const OBLIGATIONS = [
    "Risk Management (Art. 9)",
    "Data Governance (Art. 10)",
    "Transparency (Art. 13)",
    "Human Oversight (Art. 14)",
  ];

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
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ color: "#c9a84c", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            LexSutra
          </div>
          <div style={{ color: "#3d4f60", fontSize: 9, letterSpacing: "0.06em", marginTop: 2, textTransform: "uppercase" }}>
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
          <span style={{ color: "#c9a84c", fontSize: 8.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            DIAGNOSTIC
          </span>
        </div>
      </div>

      {/* Gold rule */}
      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, rgba(201,168,75,0.6) 0%, rgba(201,168,75,0.05) 100%)",
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

      {/* Status box */}
      <div
        style={{
          background: "rgba(45,156,219,0.07)",
          border: "1px solid rgba(45,156,219,0.2)",
          borderRadius: 7,
          padding: "9px 11px",
          marginBottom: 13,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ color: "#2d9cdb", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Assessment Requested
          </span>
          <span
            style={{
              background: "rgba(224,168,50,0.18)",
              color: "#e0a832",
              fontSize: 8,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 3,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Pending
          </span>
        </div>
        <div style={{ color: "#8899aa", fontSize: 9, lineHeight: 1.55 }}>
          A LexSutra compliance specialist will assess your AI footprint and respond within 24 hours.
        </div>
      </div>

      {/* Obligation indicators */}
      <div style={{ marginBottom: 13 }}>
        {OBLIGATIONS.map((ob) => (
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
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Not Assessed
            </span>
          </div>
        ))}
      </div>

      {/* Ref + date */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: "#3d4f60", fontSize: 8.5 }}>Ref: {data.ref}</span>
        <span style={{ color: "#3d4f60", fontSize: 8.5 }}>{data.date}</span>
      </div>

      {/* Footer */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 9 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#3d4f60", fontSize: 8.5 }}>lexsutra.eu</span>
        <span style={{ color: "#3d4f60", fontSize: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Deadline: Aug 2, 2026
        </span>
      </div>
    </div>
  );
}

function downloadCard(cardId: string) {
  const card = document.getElementById(cardId);
  if (!card) return;
  const win = window.open("", "_blank", "width=440,height=620");
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>LexSutra Compliance Card</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #060a14; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    @media print {
      @page { size: 3.4in 5in; margin: 0; }
      body { min-height: unset; background: #060a14; }
    }
  </style>
</head>
<body>${card.outerHTML}</body>
</html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

// ── Styles ────────────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-4 py-3 rounded-lg border bg-[#060a14] text-white placeholder-[#3d4f60] " +
  "border-white/10 focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 " +
  "focus:ring-[#c9a84c]/25 transition disabled:opacity-50 text-sm";

// ── Component ─────────────────────────────────────────────────────────────────

export function DemoForm() {
  const [form, setForm] = useState({ company_name: "", email: "", website_url: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
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

    if (!form.company_name.trim() || !form.email.trim() || !form.website_url.trim()) {
      setError("All fields are required.");
      return;
    }
    if (isPersonalEmail(form.email)) {
      setError("Please use your business email address. Personal email providers are not accepted.");
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.company_name.trim(),
          email: form.email.trim().toLowerCase(),
          website_url: form.website_url.trim(),
        }),
      });
      if (!res.ok) throw new Error("Request failed");

      setCardData({
        company: form.company_name.trim(),
        website: form.website_url.trim().replace(/^https?:\/\//, ""),
        ref: genRef(),
        date: fmtDate(new Date()),
      });
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again or email us at hello@lexsutra.eu.");
    }
  }

  if (status === "success" && cardData) {
    return (
      <div className="space-y-6">
        {/* Confirmation */}
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
            style={{ background: "rgba(76,175,124,0.15)", border: "1px solid rgba(76,175,124,0.3)" }}
          >
            <CheckCircle className="w-7 h-7" style={{ color: "#4caf7c" }} />
          </div>
          <h3 className="text-xl font-serif font-semibold text-white mb-2">Request received</h3>
          <p className="text-sm" style={{ color: "#8899aa" }}>
            We&apos;ll review your details and send a 5-insight compliance snapshot within 24 hours.
          </p>
        </div>

        {/* Compliance card */}
        <div>
          <p className="text-xs text-center mb-3" style={{ color: "#3d4f60" }}>
            Your compliance profile card — save it or share with your team
          </p>
          <ComplianceCard id="lexsutra-compliance-card" data={cardData} />
          <button
            onClick={() => downloadCard("lexsutra-compliance-card")}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: "rgba(201,168,75,0.08)",
              border: "1px solid rgba(201,168,75,0.28)",
              color: "#c9a84c",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,75,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,75,0.08)";
            }}
          >
            <Download className="w-4 h-4" />
            Download Compliance Card
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "#8899aa" }}>
          Company name
        </label>
        <input
          type="text"
          name="company_name"
          value={form.company_name}
          onChange={handleChange}
          placeholder="Acme AI GmbH"
          disabled={status === "submitting"}
          className={inputClass}
          autoComplete="organization"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "#8899aa" }}>
          Business email
        </label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@company.com"
          disabled={status === "submitting"}
          className={inputClass}
          autoComplete="email"
        />
        <p className="text-xs mt-1" style={{ color: "#3d4f60" }}>
          Personal email providers (Gmail, Outlook, etc.) are not accepted.
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "#8899aa" }}>
          Company website
        </label>
        <input
          type="url"
          name="website_url"
          value={form.website_url}
          onChange={handleChange}
          placeholder="https://company.com"
          disabled={status === "submitting"}
          className={inputClass}
          autoComplete="url"
        />
      </div>

      {/* Soft domain mismatch warning */}
      {domainMismatch && (
        <div
          className="flex items-start gap-2.5 p-3 rounded-lg"
          style={{ background: "rgba(224,168,50,0.07)", border: "1px solid rgba(224,168,50,0.2)" }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#e0a832" }} />
          <p className="text-sm" style={{ color: "#e0a832" }}>
            Your email domain doesn&apos;t match your website — please double-check these belong to the same company.
            You can still submit.
          </p>
        </div>
      )}

      {error && (
        <div
          className="flex items-start gap-2.5 p-3.5 rounded-lg"
          style={{ background: "rgba(231,76,76,0.08)", border: "1px solid rgba(231,76,76,0.2)" }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#e74c4c" }} />
          <p className="text-sm" style={{ color: "#e74c4c" }}>{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "#c9a84c", color: "#060a14" }}
        onMouseEnter={(e) => {
          if (status !== "submitting") (e.target as HTMLButtonElement).style.background = "#dbbf6a";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.background = "#c9a84c";
        }}
      >
        {status === "submitting" ? (
          "Submitting…"
        ) : (
          <>
            Get My Free Snapshot
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-center text-xs" style={{ color: "#3d4f60" }}>
        No account needed · No spam · Results within 24 hours
      </p>
    </form>
  );
}
