import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

const anthropic = new Anthropic();

type InsightVersion = {
  v: number;
  content: string;
  generated_at: string;
  internal_feedback: string | null; // feedback given to produce THIS version (null = initial)
};

type InsightsSnapshot = {
  versions: InsightVersion[];
};

const SYSTEM_INITIAL = `You are an EU AI Act compliance specialist at LexSutra, a regulatory intelligence firm. Based on a prospective client's public company profile, generate a professional pre-diagnostic compliance readiness overview.

This document will be shared with the client as their initial "AI Systems Compliance Overview." Write it to be authoritative, constructive, and forward-looking. Never include version numbers, "draft" labels, revision notes, or any internal language.

Structure the document using clean markdown with exactly these sections:

## Company Profile
## Likely AI Use Cases
## EU AI Act Risk Classification
## Preliminary Compliance Indicators
## Recommended Next Steps

Guidelines:
- 450–600 words total
- Be specific to the company's likely sector and use cases based on their name and website
- Reference relevant EU AI Act articles where appropriate (Regulation EU 2024/1689)
- Use the EU AI Act risk tiering: Unacceptable / High-Risk / Limited-Risk / Minimal-Risk
- Tone: expert legal-adjacent advisory — confident, not alarmist`;

const SYSTEM_REFINE = `You are an EU AI Act compliance specialist at LexSutra. You are revising a pre-diagnostic compliance overview based on internal expert feedback.

The client receives only the final document. Never include version numbers, "draft" labels, internal notes, or any language referencing the revision process.

Produce a complete, standalone revised document incorporating the feedback. Maintain the same section structure and 450–600 word length. Write as if this is the first and only version the client will see.`;

export async function POST(req: NextRequest) {
  // TODO: re-enable auth before production
  const adminClient = createSupabaseAdminClient();

  try {
    const body = await req.json() as { demoId: string; feedback?: string };
    const { demoId, feedback } = body;

    if (!demoId) return NextResponse.json({ error: "Missing demoId" }, { status: 400 });

    // Load demo
    const { data: demo, error: demoError } = await adminClient
      .from("demo_requests")
      .select("id, company_name, website_url, insights_snapshot")
      .eq("id", demoId)
      .single();

    if (demoError || !demo) {
      return NextResponse.json({ error: "Demo request not found" }, { status: 404 });
    }

    const snapshot = (demo.insights_snapshot ?? { versions: [] }) as InsightsSnapshot;
    const existingVersions = snapshot.versions ?? [];
    const currentVersion   = existingVersions[existingVersions.length - 1] ?? null;
    const isRefinement     = !!feedback && !!currentVersion;

    // Build prompt
    let userMessage: string;
    let systemPrompt: string;

    if (isRefinement) {
      systemPrompt = SYSTEM_REFINE;
      userMessage  = `Current document:\n---\n${currentVersion.content}\n---\n\nInternal revision notes:\n${feedback}`;
    } else {
      systemPrompt = SYSTEM_INITIAL;
      userMessage  = `Company: ${demo.company_name}\nWebsite: ${demo.website_url ?? "(not provided)"}`;
    }

    // Call Claude
    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 2048,
      system:     systemPrompt,
      messages:   [{ role: "user", content: userMessage }],
    });

    const content = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    // Save new version
    const newVersion: InsightVersion = {
      v:                 existingVersions.length + 1,
      content,
      generated_at:      new Date().toISOString(),
      internal_feedback: isRefinement ? (feedback ?? null) : null,
    };

    const updatedSnapshot: InsightsSnapshot = {
      versions: [...existingVersions, newVersion],
    };

    const { error: saveError } = await adminClient
      .from("demo_requests")
      .update({ insights_snapshot: updatedSnapshot })
      .eq("id", demoId);

    if (saveError) {
      await logError({ error: saveError, source: "api/admin/demo-analysis", action: "POST:save", metadata: { demoId } });
      return NextResponse.json({ error: "Failed to save analysis." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      version: newVersion.v,
      content: newVersion.content,
      totalVersions: updatedSnapshot.versions.length,
    });

  } catch (err) {
    await logError({ error: err, source: "api/admin/demo-analysis", action: "POST", metadata: {} });
    return NextResponse.json({ error: "Analysis generation failed. Please try again." }, { status: 500 });
  }
}
