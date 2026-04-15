import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TYPE_LABELS: Record<string, string> = {
  prospect_outreach: "initial outreach to a prospect",
  prospect_followup: "follow-up to a prospect you've already contacted",
  job_followup: "follow-up after applying to a job",
  cover_note: "cover letter / introductory email for a job application",
};

const TONE_LABELS: Record<string, string> = {
  warm: "warm and personable",
  direct: "direct and concise",
  formal: "professional and formal",
};

export async function POST(req: NextRequest) {
  const { context, type, tone, recordId, recordType } = await req.json();

  if (!context || !type || !tone) {
    return NextResponse.json({ error: "context, type, and tone are required" }, { status: 400 });
  }

  const typeLabel = TYPE_LABELS[type] ?? type;
  const toneLabel = TONE_LABELS[tone] ?? tone;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are drafting emails for Kunal, founder of LexSutra (EU AI Act compliance diagnostics for AI startups in HR tech and Fintech).

Write in his voice: knowledgeable, direct, no fluff, short paragraphs. Not salesy. No buzzwords.
Kunal is Dutch-based, operating across the EU. LexSutra charges €2,200 for a full diagnostic.

Context (LinkedIn profile / company info / job description):
${context}

Draft a ${typeLabel} email with ${toneLabel} tone.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{"subject": "the email subject line", "body": "the full email body text"}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";
  let subject = "";
  let body = "";
  try {
    const parsed = JSON.parse(raw);
    subject = parsed.subject ?? "";
    body = parsed.body ?? "";
  } catch {
    // Fallback: treat entire response as body
    body = raw;
  }
  const draft = body;

  // If a recordId is passed, optionally save the draft
  if (recordId && recordType) {
    const db = createSupabaseAdminClient();
    const table = recordType === "prospect" ? "prospect_messages" : "job_messages";
    const fkField = recordType === "prospect" ? "prospect_id" : "job_id";
    await db.from(table).insert({
      [fkField]: recordId,
      label: `${typeLabel} (${toneLabel})`,
      content: draft,
    });
  }

  return NextResponse.json({ draft, subject, body });
}
