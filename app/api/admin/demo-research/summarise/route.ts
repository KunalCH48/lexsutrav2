import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

const anthropic = new Anthropic();
const BUCKET    = "documents";

type ResearchFile = { path: string; name: string; size: number };

const SUMMARISE_PROMPT = (companyName: string, fileNames: string[]) => `
You are a senior EU AI Act compliance analyst at LexSutra.

The admin has uploaded ${fileNames.length} research document(s) about "${companyName}":
${fileNames.map((n, i) => `  ${i + 1}. ${n}`).join("\n")}

These may include exported webpages, privacy policies, terms of service, LinkedIn pages, job postings, product documentation, press releases, or any other public material the admin has gathered.

Analyse ALL provided documents and produce a structured RESEARCH BRIEF. This brief will be passed to Claude in Phase 2 to generate a full EU AI Act compliance snapshot report. Write for AI comprehension — be specific, cite source documents, avoid filler.

Structure your brief exactly as follows:

**AI SYSTEMS IDENTIFIED**
List each distinct AI system the company appears to operate or offer. For each: name, what it does, who the affected persons are, approximate scale (if mentioned). If multiple systems, note the highest-risk one.

**ANNEX III RISK CLASSIFICATION**
Does any system fall into a high-risk domain under EU AI Act Annex III? State yes/no for each domain and cite the exact evidence:
- Employment & HR (CV screening, hiring, performance evaluation, worker monitoring)
- Credit & financial services (creditworthiness, loan eligibility, insurance)
- Education (admissions, student assessment, scoring)
- Healthcare (diagnosis, treatment recommendations)
- Law enforcement (crime prediction, risk profiling)
- Critical infrastructure (energy, water, transport)
- Migration & border control
- Biometric identification

**COMPLIANCE EVIDENCE FOUND**
For each of the 8 EU AI Act obligations, state what evidence was found in the documents (cite source) or "No public evidence found":
1. Risk Management System (Art. 9) — risk docs, AI risk assessment, lifecycle risk process
2. Data Governance (Art. 10) — bias testing, dataset documentation, representation analysis
3. Technical Documentation (Art. 11) — architecture docs, algorithm descriptions, validation
4. Logging & Record-Keeping (Art. 12) — audit trails, decision logs, retention policies
5. Transparency (Art. 13) — AI disclosure to users/deployers, instructions for use, limitations stated
6. Human Oversight (Art. 14) — override mechanisms, operator training, human review in workflow
7. Accuracy & Robustness (Art. 15) — published benchmarks, testing methodology, adversarial testing
8. Conformity Assessment (Art. 43) — CE marking, EU Declaration of Conformity, database registration

**JOB POSTINGS & INTERNAL SIGNALS**
Any job postings, team pages, or press releases that reveal AI products, compliance roles, or internal capabilities not mentioned on the main marketing pages?

**KEY VERBATIM QUOTES**
Up to 5 direct quotes from the documents most relevant to compliance assessment. Format: "Quote..." — [Source document name]

Keep the entire brief under 800 words. Be factual and precise.
`.trim();

// ── POST /api/admin/demo-research/summarise ───────────────────────────────────

export async function POST(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();

  try {
    const { demoId } = await req.json() as { demoId: string };
    if (!demoId) return NextResponse.json({ error: "Missing demoId." }, { status: 400 });

    // Load demo + file list
    const { data: demo, error: demoErr } = await adminClient
      .from("demo_requests")
      .select("company_name, research_files")
      .eq("id", demoId)
      .single();

    if (demoErr || !demo) {
      return NextResponse.json({ error: "Demo request not found." }, { status: 404 });
    }

    const files = (demo.research_files as ResearchFile[]) ?? [];
    if (files.length === 0) {
      return NextResponse.json({ error: "No research files uploaded yet." }, { status: 400 });
    }

    // Download each PDF from Supabase Storage and convert to base64
    type DocBlock = {
      type: "document";
      source: { type: "base64"; media_type: "application/pdf"; data: string };
      title: string;
    };

    const documentBlocks: DocBlock[] = [];
    const skipped: string[] = [];

    for (const f of files) {
      try {
        const { data, error } = await adminClient.storage.from(BUCKET).download(f.path);
        if (error || !data) { skipped.push(f.name); continue; }

        const buffer = Buffer.from(await data.arrayBuffer());
        documentBlocks.push({
          type:   "document",
          source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") },
          title:  f.name,
        });
      } catch {
        skipped.push(f.name);
      }
    }

    if (documentBlocks.length === 0) {
      return NextResponse.json({ error: "Could not read any of the uploaded files." }, { status: 500 });
    }

    // Call Claude — Phase 1: read all PDFs, produce structured brief
    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{
        role:    "user",
        content: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(documentBlocks as any[]),
          {
            type: "text",
            text: SUMMARISE_PROMPT(demo.company_name, files.map((f) => f.name)),
          },
        ],
      }],
    });

    const brief = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    // Save brief to DB
    await adminClient.from("demo_requests").update({ research_brief: brief }).eq("id", demoId);

    return NextResponse.json({
      success: true,
      brief,
      filesRead:    documentBlocks.length,
      filesSkipped: skipped,
    });

  } catch (err) {
    await logError({ error: err, source: "api/admin/demo-research/summarise", action: "POST", metadata: {} });
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Summarisation failed: ${msg}` }, { status: 500 });
  }
}
