import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logError } from "@/lib/log-error";
import Anthropic from "@anthropic-ai/sdk";

const NOTIFY_EMAIL = "kunal.lexutra@gmail.com";

// ── Rate limiting ─────────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

// ── Supabase ──────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Assessment types ──────────────────────────────────────────────────────────

export type Assessment = {
  overall_risk: string;
  risk_explanation: string;
  top_obligations: string[];
  key_findings: string[];
  confidence: string;
};

// ── Website content fetcher ───────────────────────────────────────────────────

async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LexSutra-Assessment/1.0; +https://lexsutra.eu)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(t);
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z#0-9]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);
  } catch {
    return "";
  }
}

// ── Claude assessment ─────────────────────────────────────────────────────────

async function generateAssessment(
  company_name: string,
  website_url: string,
  website_content: string
): Promise<Assessment | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const anthropic = new Anthropic();
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `You are an EU AI Act compliance expert. Provide a preliminary assessment for this company based on their public information.

Company: ${company_name}
Website: ${website_url}
${
  website_content
    ? `Public website content:\n${website_content}`
    : "Website content unavailable — assess from company name and domain only."
}

EU AI Act Annex III HIGH-RISK categories (these require full compliance):
- Employment & HR (recruitment, CV screening, performance evaluation, task allocation)
- Credit & financial services (creditworthiness scoring, insurance risk assessment)
- Education (student admission, assessment, evaluation systems)
- Healthcare & medical devices (diagnosis, treatment recommendations)
- Critical infrastructure (energy, water, transport)
- Law enforcement & justice (crime prediction, evidence evaluation)
- Migration & border control (visa assessment, identity verification)
- Access to essential public services

Return ONLY a valid JSON object — no markdown, no commentary:
{
  "overall_risk": "High Risk" | "Likely High Risk" | "Limited Risk" | "Minimal Risk" | "Needs Assessment",
  "risk_explanation": "One sentence, max 20 words, specific to this company",
  "top_obligations": ["Max 3 items, include article e.g. Risk Management (Art. 9)"],
  "key_findings": ["2 findings, max 18 words each, specific to this company not generic"],
  "confidence": "High" | "Medium" | "Low"
}

Rules:
- If company clearly operates in an Annex III domain → High Risk or Likely High Risk
- If general SaaS/tech with AI features, purpose unclear → Needs Assessment
- If clearly internal tools, marketing, or content → Limited Risk or Minimal Risk
- confidence=High if website clearly describes their AI product; Low if minimal public info
- key_findings must be concrete and company-specific — not generic compliance statements`,
        },
      ],
    });

    const text =
      msg.content[0].type === "text" ? msg.content[0].text : "";
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    return JSON.parse(cleaned) as Assessment;
  } catch {
    return null;
  }
}

// ── Email builders ────────────────────────────────────────────────────────────

const RISK_EMAIL_COLORS: Record<string, { color: string; bg: string }> = {
  "High Risk":        { color: "#e74c4c", bg: "#1a0a0a" },
  "Likely High Risk": { color: "#e08040", bg: "#1a1208" },
  "Limited Risk":     { color: "#2d9cdb", bg: "#081218" },
  "Minimal Risk":     { color: "#2ecc71", bg: "#081a0e" },
  "Needs Assessment": { color: "#e0a832", bg: "#181408" },
};

function buildAdminEmail(
  company_name: string,
  email: string,
  website_url: string,
  assessment: Assessment | null
): string {
  return `
    <div style="font-family:sans-serif;font-size:14px;">
      <h2>New Demo Request</h2>
      <table cellpadding="8" style="border-collapse:collapse;">
        <tr><td><strong>Company</strong></td><td>${company_name}</td></tr>
        <tr><td><strong>Email</strong></td><td>${email}</td></tr>
        <tr><td><strong>Website</strong></td><td><a href="${website_url}">${website_url}</a></td></tr>
      </table>
      ${
        assessment
          ? `<h3>AI Assessment</h3>
             <p><strong>Risk:</strong> ${assessment.overall_risk} &middot; <strong>Confidence:</strong> ${assessment.confidence}</p>
             <p>${assessment.risk_explanation}</p>
             <p><strong>Findings:</strong><br/>${assessment.key_findings.join("<br/>")}</p>
             <p><strong>Top obligations:</strong> ${assessment.top_obligations.join(", ")}</p>`
          : "<p><em>Assessment generation failed — review manually.</em></p>"
      }
      <p style="color:#888;font-size:12px;margin-top:24px;">Submitted via lexsutra.eu</p>
    </div>
  `;
}

function buildProspectEmail(
  company_name: string,
  assessment: Assessment | null
): string {
  const rc =
    assessment
      ? (RISK_EMAIL_COLORS[assessment.overall_risk] ??
         RISK_EMAIL_COLORS["Needs Assessment"])
      : null;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#060a14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">

  <!-- Logo -->
  <div style="text-align:center;margin-bottom:36px;">
    <div style="font-size:22px;font-weight:700;letter-spacing:0.01em;">
      <span style="color:#c9a84c;">Lex</span><span style="color:#e8f4ff;">Sutra</span>
    </div>
    <div style="color:#3d4f60;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px;">
      EU AI Act · Compliance Diagnostic
    </div>
  </div>

  <!-- Intro -->
  <p style="color:#e8f4ff;font-size:14px;line-height:1.75;margin-bottom:28px;">
    Thank you for reaching out, <strong style="color:#dbbf6a;">${company_name}</strong>.<br/>
    Based on your public digital footprint, here is your preliminary EU AI Act compliance profile.
    Our team will follow up within 24 hours.
  </p>

  ${
    assessment && rc
      ? `
  <!-- Risk classification -->
  <div style="background:${rc.bg};border:1px solid ${rc.color}44;border-radius:8px;padding:18px 20px;margin-bottom:22px;">
    <div style="font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${rc.color};margin-bottom:8px;">
      Preliminary Risk Classification
    </div>
    <div style="font-size:20px;font-weight:700;color:${rc.color};margin-bottom:10px;">
      ${assessment.overall_risk}
    </div>
    <div style="font-size:13px;color:#8899aa;line-height:1.65;">
      ${assessment.risk_explanation}
    </div>
  </div>

  <!-- Key findings -->
  <div style="margin-bottom:22px;">
    <div style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#c9a84c;margin-bottom:12px;">
      Key Findings
    </div>
    ${assessment.key_findings
      .map(
        (f) => `
    <div style="display:flex;gap:10px;margin-bottom:10px;align-items:flex-start;">
      <div style="width:5px;height:5px;border-radius:50%;background:${rc.color};margin-top:5px;flex-shrink:0;"></div>
      <div style="font-size:13px;color:#8899aa;line-height:1.65;">${f}</div>
    </div>`
      )
      .join("")}
  </div>

  <!-- Top obligations -->
  <div style="margin-bottom:24px;">
    <div style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#c9a84c;margin-bottom:12px;">
      Priority Obligations to Address
    </div>
    ${assessment.top_obligations
      .map(
        (o) => `
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:9px 13px;margin-bottom:6px;font-size:13px;color:#e8f4ff;">
      ${o}
    </div>`
      )
      .join("")}
  </div>

  <!-- Disclaimer -->
  <p style="font-size:11px;color:#3d4f60;font-style:italic;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;margin-bottom:28px;line-height:1.6;">
    Assessment confidence: ${assessment.confidence} &middot;
    Based on publicly available information only. This is a preliminary indicator,
    not a compliance certificate. A full diagnostic assessment is required for regulatory purposes.
  </p>`
      : `
  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:18px 20px;margin-bottom:28px;">
    <p style="color:#8899aa;font-size:13px;margin:0;line-height:1.65;">
      Our team will review your submission and send you a personalised compliance snapshot within 24 hours.
    </p>
  </div>`
  }

  <!-- AI Inventory CTA -->
  <div style="background:rgba(201,168,75,0.07);border:1px solid rgba(201,168,75,0.22);border-radius:8px;padding:22px;margin-bottom:28px;text-align:center;">
    <div style="font-size:14px;font-weight:700;color:#dbbf6a;margin-bottom:10px;">
      Next step: build your AI system inventory
    </div>
    <p style="font-size:13px;color:#8899aa;margin-bottom:18px;line-height:1.65;">
      Before a full diagnostic, you'll need to map every AI system you operate or deploy.
      We've built a free template — takes under an hour.
    </p>
    <a href="https://lexsutra.eu/ai-inventory"
       style="display:inline-block;background:#c9a84c;color:#060a14;padding:11px 26px;border-radius:6px;font-weight:700;font-size:13px;text-decoration:none;">
      Download Free AI Inventory Template &rarr;
    </a>
  </div>

  <!-- Footer -->
  <div style="border-top:1px solid rgba(255,255,255,0.05);padding-top:20px;text-align:center;">
    <p style="color:#8899aa;font-size:13px;line-height:1.75;margin-bottom:10px;">
      Questions? Reply to this email or reach us at
      <a href="mailto:hello@lexsutra.eu" style="color:#c9a84c;text-decoration:none;">hello@lexsutra.eu</a>
    </p>
    <p style="color:#3d4f60;font-size:11px;margin:0;line-height:1.6;">
      LexSutra &middot; lexsutra.eu &middot; Based in the Netherlands<br/>
      LexSutra provides compliance infrastructure tools, not legal advice.
    </p>
  </div>

</div>
</body>
</html>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  let company_name = "";
  let email = "";

  try {
    const body = await req.json();
    company_name = body.company_name ?? "";
    email = body.email ?? "";
    const website_url: string = body.website_url ?? "";

    if (!company_name || !email || !website_url) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // 1. Save to DB
    const { error: dbError } = await supabase
      .from("demo_requests")
      .insert([
        { company_name, contact_email: email, website_url, status: "pending" },
      ]);

    if (dbError) {
      await logError({
        error: dbError,
        source: "api/demo-request",
        action: "POST",
        metadata: { company_name, email, website_url },
      });
      return NextResponse.json(
        { error: "Failed to save your request. Please try again." },
        { status: 500 }
      );
    }

    // 2. Fetch website + run assessment (sequential — assessment needs content)
    const websiteContent = await fetchWebsiteContent(website_url);
    const assessment = await generateAssessment(
      company_name,
      website_url,
      websiteContent
    );

    // 3. Fire both emails in parallel (don't block on failure)
    if (process.env.RESEND_API_KEY) {
      await Promise.allSettled([
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "LexSutra <hello@lexsutra.eu>",
            to: [NOTIFY_EMAIL],
            subject: `New demo request — ${company_name}`,
            html: buildAdminEmail(company_name, email, website_url, assessment),
          }),
        }),
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "LexSutra <hello@lexsutra.eu>",
            to: [email],
            replyTo: "hello@lexsutra.eu",
            subject: `Your preliminary EU AI Act profile — ${company_name}`,
            html: buildProspectEmail(company_name, assessment),
          }),
        }),
      ]);
    }

    return NextResponse.json({ success: true, assessment });
  } catch (err) {
    await logError({
      error: err,
      source: "api/demo-request",
      action: "POST",
      metadata: { company_name, email },
    });
    return NextResponse.json(
      {
        error:
          "Something went wrong. Please try again or email us at hello@lexsutra.eu.",
      },
      { status: 500 }
    );
  }
}
