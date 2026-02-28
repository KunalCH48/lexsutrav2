import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

const client = new Anthropic();

// Only callable by admin — generates draft findings from client responses
export async function POST(req: NextRequest) {
  let userId: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    userId = user.id;

    const adminClient = createSupabaseAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "reviewer"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { diagnosticId } = await req.json() as { diagnosticId: string };
    if (!diagnosticId) return NextResponse.json({ error: "Missing diagnosticId" }, { status: 400 });

    // Fetch diagnostic + obligations + questions + responses in parallel
    const [{ data: diagnostic }, { data: obligations }, { data: responses }] = await Promise.all([
      adminClient
        .from("diagnostics")
        .select(`id, status, policy_versions ( version_code, display_name, notes ), ai_systems ( name, risk_category, description )`)
        .eq("id", diagnosticId)
        .single(),
      adminClient
        .from("obligations")
        .select("id, name:title, article_ref:eu_article_ref, description")
        .order("id"),
      adminClient
        .from("diagnostic_responses")
        .select(`
          response_text,
          diagnostic_questions ( question_text, question_type, obligation_id )
        `)
        .eq("diagnostic_id", diagnosticId),
    ]);

    if (!diagnostic) return NextResponse.json({ error: "Diagnostic not found" }, { status: 404 });

    const sys = Array.isArray(diagnostic.ai_systems)
      ? diagnostic.ai_systems[0]
      : diagnostic.ai_systems;
    const pv  = Array.isArray(diagnostic.policy_versions)
      ? diagnostic.policy_versions[0]
      : diagnostic.policy_versions;

    // Build per-obligation Q&A summary
    const obligationQA: Record<string, { name: string; article: string; description: string; qa: string[] }> = {};

    for (const ob of (obligations ?? [])) {
      obligationQA[ob.id] = {
        name:        ob.name,
        article:     ob.article_ref,
        description: ob.description,
        qa:          [],
      };
    }

    for (const r of (responses ?? [])) {
      const q    = Array.isArray(r.diagnostic_questions) ? r.diagnostic_questions[0] : r.diagnostic_questions;
      const obId = (q as { obligation_id: string } | null)?.obligation_id;
      if (obId && obligationQA[obId]) {
        obligationQA[obId].qa.push(
          `Q: ${(q as { question_text: string }).question_text}\nA: ${r.response_text}`
        );
      }
    }

    // Build the prompt
    const obligationSummaries = Object.values(obligationQA)
      .map((ob) => `## ${ob.name} (${ob.article})\n${ob.description}\n\nClient responses:\n${ob.qa.join("\n\n") || "(No responses provided)"}`)
      .join("\n\n---\n\n");

    const systemPrompt = `You are an EU AI Act compliance expert working for LexSutra, a compliance diagnostics firm. You are generating draft compliance findings for a client assessment report based on the client's own questionnaire responses.

Your role:
- Analyse each of the 8 EU AI Act obligation areas independently
- Assign a compliance score: "compliant", "partial", "critical", or "not_started"
- Write a concise finding (2-4 sentences) describing the current compliance posture
- Provide a specific legal citation from the EU AI Act (Regulation EU 2024/1689)
- Suggest a practical remediation action for any non-compliant or partial areas

Scoring criteria:
- "compliant": Strong evidence of meeting the obligation with documented procedures
- "partial": Some measures in place but gaps or missing documentation remain
- "critical": Significant gaps that pose regulatory or operational risk
- "not_started": No evidence of addressing this obligation

Output ONLY valid JSON — no markdown code blocks, no extra text. Use this exact structure:
[
  {
    "obligation_id": "<uuid>",
    "score": "compliant|partial|critical|not_started",
    "finding_text": "...",
    "citation": "EU AI Act — Art. X | Regulation (EU) 2024/1689",
    "remediation": "..."
  }
]`;

    const userMessage = `AI System: ${sys?.name ?? "Unknown"}
Risk Category: ${sys?.risk_category ?? "Unknown"}
Description: ${sys?.description ?? "—"}
Regulation Version: ${pv?.display_name ?? "EU AI Act — Regulation (EU) 2024/1689"}

Obligation IDs for reference:
${Object.entries(obligationQA).map(([id, ob]) => `- ${ob.name}: "${id}"`).join("\n")}

---

${obligationSummaries}`;

    // Call Claude
    const message = await client.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        { role: "user", content: userMessage },
      ],
      system: systemPrompt,
    });

    const rawText = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    let findings: Array<{
      obligation_id: string;
      score: string;
      finding_text: string;
      citation: string;
      remediation: string;
    }>;

    try {
      findings = JSON.parse(rawText);
    } catch {
      await logError({
        error: new Error("Claude returned unparseable JSON"),
        source: "api/diagnostics/generate",
        action: "POST:parseResponse",
        userId,
        metadata: { diagnosticId, raw: rawText.slice(0, 500) },
      });
      return NextResponse.json({ error: "AI response could not be parsed. Please try again." }, { status: 500 });
    }

    // Upsert findings
    const rows = findings.map((f) => ({
      diagnostic_id: diagnosticId,
      obligation_id: f.obligation_id,
      score:         f.score,
      finding_text:  f.finding_text,
      citation:      f.citation,
      remediation:   f.remediation,
    }));

    const { error: upsertError } = await adminClient
      .from("diagnostic_findings")
      .upsert(rows, { onConflict: "diagnostic_id,obligation_id" });

    if (upsertError) {
      await logError({
        error: upsertError,
        source: "api/diagnostics/generate",
        action: "POST:upsertFindings",
        userId,
        metadata: { diagnosticId },
      });
      return NextResponse.json({ error: "Failed to save generated findings." }, { status: 500 });
    }

    // Set status to 'draft' (ready for admin review in FindingsEditor)
    await adminClient
      .from("diagnostics")
      .update({ status: "draft" })
      .eq("id", diagnosticId);

    await adminClient.from("activity_log").insert({
      actor_id:    user.id,
      action:      "generate_findings",
      entity_type: "diagnostics",
      entity_id:   diagnosticId,
      metadata:    { finding_count: rows.length, model: "claude-sonnet-4-6" },
    });

    return NextResponse.json({ success: true, findingCount: rows.length });

  } catch (err) {
    await logError({
      error: err,
      source: "api/diagnostics/generate",
      action: "POST",
      userId,
      metadata: {},
    });
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}
