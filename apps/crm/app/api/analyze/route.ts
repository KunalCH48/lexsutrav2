import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { prospectId, url, notes } = await req.json();

  if (!prospectId || !url) {
    return NextResponse.json({ error: "prospectId and url required" }, { status: 400 });
  }

  // Fetch and scrape the URL
  let pageContent = "";
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LexSutraCRM/1.0)" },
    });
    const html = await response.text();
    // Strip HTML tags and collapse whitespace
    pageContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
  } catch (err) {
    pageContent = `[Could not fetch URL: ${err instanceof Error ? err.message : "timeout"}]`;
  }

  // Load ICP
  const db = createSupabaseAdminClient();
  const { data: icpData } = await db.from("icp_config").select("description").eq("id", 1).single();
  const icp = icpData?.description ?? "AI startups in EU using high-risk AI systems";

  // Call Claude Haiku
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a sales qualification analyst for LexSutra (EU AI Act compliance diagnostics).

Analyze this company against our ICP and return ONLY valid JSON with no markdown, no explanation:
{
  "score": "strong" | "possible" | "unlikely",
  "headline": "one sentence verdict",
  "reasoning": ["point 1", "point 2", "point 3"],
  "approach_angle": "What pain to lead with in outreach",
  "red_flags": ["concern if any"]
}

ICP: ${icp}

URL: ${url}
Page content: ${pageContent}
${notes ? `Additional notes: ${notes}` : ""}`,
      },
    ],
  });

  const rawText = message.content[0].type === "text" ? message.content[0].text : "";

  let analysis: {
    score: string;
    headline: string;
    reasoning: string[];
    approach_angle: string;
    red_flags: string[];
  };
  try {
    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    analysis = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw: rawText }, { status: 500 });
  }

  // Save to prospect
  const { error: updateError } = await db
    .from("prospects")
    .update({
      icp_score: analysis.score,
      icp_report: JSON.stringify(analysis),
    })
    .eq("id", prospectId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(analysis);
}
