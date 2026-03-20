import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

const anthropic = new Anthropic();

// Official EU AI Act sources to monitor
const SOURCES = [
  {
    name: "EU AI Office",
    url:  "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
  },
  {
    name: "EU AI Act — EUR-Lex",
    url:  "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32024R1689",
  },
  {
    name: "EU AI Office — News",
    url:  "https://digital-strategy.ec.europa.eu/en/news/artificial-intelligence",
  },
];

// Strip HTML tags and collapse whitespace to get readable plain text
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
}

type IntelItem = {
  title: string;
  change_summary: string;
  affected_obligations: string[];
  impact_level: "high" | "medium" | "low";
  example_impact: string;
  published_at: string | null;
};

export async function POST(req: NextRequest) {
  let userId: string | null = null;

  try {
    // Auth — admin or reviewer only
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

    let totalAdded = 0;
    const errors: string[] = [];

    for (const source of SOURCES) {
      try {
        // Fetch the page
        const res = await fetch(source.url, {
          headers: {
            "Accept":     "text/html,application/xhtml+xml",
            "User-Agent": "LexSutra-RegulatoryMonitor/1.0 (compliance@lexsutra.com)",
          },
          signal: AbortSignal.timeout(15_000),
        });

        if (!res.ok) {
          errors.push(`${source.name}: HTTP ${res.status}`);
          continue;
        }

        const html = await res.text();
        const text = stripHtml(html).slice(0, 12_000); // cap at 12k chars for Claude

        // Ask Claude to extract regulatory developments from this page
        const message = await anthropic.messages.create({
          model:      "claude-sonnet-4-6",
          max_tokens: 2048,
          system: `You are a EU AI Act regulatory analyst. Your job is to extract significant regulatory developments, publications, amendments, guidance documents, or implementation milestones from official EU website content.

Return ONLY a valid JSON array. If there is nothing significant, return an empty array [].

Each item must use this exact structure:
{
  "title": "Short descriptive title of the development",
  "change_summary": "2-3 sentences in plain English explaining what this development is and what changed or was published",
  "affected_obligations": ["Risk Management", "Transparency"],
  "impact_level": "high|medium|low",
  "example_impact": "One concrete example of how this affects a high-risk AI company (e.g. an HR tech firm using automated CV screening)",
  "published_at": "ISO date string if visible, or null"
}

Obligation names to use (pick only those that apply):
Risk Management System, Data Governance, Technical Documentation, Logging and Record Keeping, Transparency, Human Oversight, Accuracy and Robustness, Conformity Assessment

Impact levels:
- high: direct regulatory obligation change, new deadline, enforcement action
- medium: guidance document, clarification, new technical standard
- low: policy statement, consultation, background publication`,
          messages: [
            {
              role:    "user",
              content: `Source: ${source.name}\nURL: ${source.url}\n\nPage content:\n${text}`,
            },
          ],
        });

        const rawText = message.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");

        let items: IntelItem[];
        try {
          // Claude sometimes wraps in ```json ... ``` — strip it
          const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
          items = JSON.parse(cleaned);
          if (!Array.isArray(items)) items = [];
        } catch {
          errors.push(`${source.name}: Claude returned unparseable JSON`);
          continue;
        }

        if (items.length === 0) continue;

        // Deduplicate: skip titles we already have from this source (exact match)
        const { data: existing } = await adminClient
          .from("regulatory_intel")
          .select("title")
          .eq("source_name", source.name);

        const existingTitles = new Set((existing ?? []).map((r: { title: string }) => r.title.toLowerCase()));

        const toInsert = items
          .filter((item) => !existingTitles.has(item.title.toLowerCase()))
          .map((item) => ({
            title:                item.title,
            source_name:          source.name,
            source_url:           source.url,
            published_at:         item.published_at ?? null,
            fetched_at:           new Date().toISOString(),
            change_summary:       item.change_summary,
            affected_obligations: item.affected_obligations ?? [],
            impact_level:         item.impact_level ?? "medium",
            example_impact:       item.example_impact,
            raw_content:          text.slice(0, 3000), // store first 3k chars for reference
          }));

        if (toInsert.length > 0) {
          const { error: insertError } = await adminClient
            .from("regulatory_intel")
            .insert(toInsert);

          if (insertError) {
            errors.push(`${source.name}: DB insert failed — ${insertError.message}`);
          } else {
            totalAdded += toInsert.length;
          }
        }

      } catch (sourceErr) {
        errors.push(`${source.name}: ${sourceErr instanceof Error ? sourceErr.message : "Unknown error"}`);
      }
    }

    await adminClient.from("activity_log").insert({
      actor_id:    user.id,
      action:      "fetch_regulatory_intel",
      entity_type: "regulatory_intel",
      entity_id:   null,
      metadata:    { added: totalAdded, errors },
    });

    return NextResponse.json({ success: true, added: totalAdded, errors });

  } catch (err) {
    await logError({
      error: err,
      source: "api/admin/regulatory-intel/fetch",
      action: "POST",
      userId,
      metadata: {},
    });
    return NextResponse.json({ error: "Fetch failed. Please try again." }, { status: 500 });
  }
}
