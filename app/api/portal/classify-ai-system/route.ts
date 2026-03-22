import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const maxDuration = 30;

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are an EU AI Act compliance classifier. Given an AI system's details, classify its risk level under the EU AI Act (Regulation EU 2024/1689).

Return ONLY a valid JSON object with exactly three fields:
{
  "risk_category": "<one of: unacceptable | high_risk | limited_risk | minimal_risk | general_purpose>",
  "reason": "<one plain-language sentence, max 25 words, explaining the classification>",
  "annex_iii_domain": "<specific Annex III domain string if high_risk, e.g. 'Art. 6 — Employment and workers management' or 'Art. 6 — Access to credit' or null if not high-risk>"
}

Risk category definitions:
- unacceptable: prohibited AI — social scoring by public authorities, real-time biometric surveillance in public spaces, manipulation of vulnerable groups, subliminal techniques
- high_risk: Annex III systems — HR/employment/worker management decisions, credit scoring/access to financial services, biometric identification or categorisation, critical infrastructure control, essential services (education admissions, healthcare triage), law enforcement, migration/asylum/border control
- limited_risk: AI that interacts directly with humans or generates synthetic content — chatbots, AI-written text, recommendation systems affecting consumer choices — transparency obligations apply
- minimal_risk: all other AI with no significant impact on people's rights, health, or safety — spam filters, inventory optimisation, internal analytics, non-public facing tools
- general_purpose: foundation models or general-purpose AI usable for many tasks (GPT-4, Claude, Gemini, Llama, Mistral, etc.) — not a standalone deployment context

Annex III domains (use these exact strings):
- "Art. 6 — Employment and workers management"
- "Art. 6 — Access to essential private services and public services"
- "Art. 6 — Credit and insurance"
- "Art. 6 — Education and vocational training"
- "Art. 6 — Law enforcement"
- "Art. 6 — Migration, asylum and border control"
- "Art. 6 — Administration of justice"
- "Art. 6 — Critical infrastructure"
- "Art. 6 — Biometric identification and categorisation"

Do not include any text outside the JSON object.`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { name, url, useCase, role, vendor, dataSubjects, companyName } = await req.json() as {
      name: string;
      url?: string;
      useCase: string;
      role?: string;
      vendor?: string;
      dataSubjects?: string;
      companyName?: string;
    };

    if (!name?.trim() || !useCase?.trim()) {
      return NextResponse.json({ error: "name and useCase are required" }, { status: 400 });
    }

    const userMessage = [
      `AI system name: ${name.trim()}`,
      url?.trim()          ? `System URL: ${url.trim()}`                     : null,
      `Use case: ${useCase.trim()}`,
      role?.trim()         ? `Organisation's role: ${role.trim()}`           : null,
      vendor?.trim()       ? `Vendor/origin: ${vendor.trim()}`               : null,
      dataSubjects?.trim() ? `Data subjects affected: ${dataSubjects.trim()}`: null,
      companyName?.trim()  ? `Company: ${companyName.trim()}`                : null,
    ].filter(Boolean).join("\n");

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = (message.content[0] as { type: string; text: string }).text.trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Classification failed — unexpected model response" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]) as {
      risk_category: string;
      reason: string;
      annex_iii_domain?: string | null;
    };

    const validCategories = ["unacceptable", "high_risk", "limited_risk", "minimal_risk", "general_purpose"];
    if (!validCategories.includes(result.risk_category)) {
      result.risk_category = "minimal_risk";
    }

    return NextResponse.json({
      risk_category:    result.risk_category,
      reason:           result.reason ?? "",
      annex_iii_domain: result.annex_iii_domain ?? null,
    });

  } catch (err) {
    console.error("[classify-ai-system]", err);
    return NextResponse.json({ error: "Classification failed. Please try again." }, { status: 500 });
  }
}
