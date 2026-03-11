import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import { logError } from "@/lib/log-error";

const anthropic = new Anthropic();
const BUCKET    = "documents";

// Keep each Claude request under ~18 MB of base64 data (leaves room for prompt overhead)
const MAX_BATCH_CHARS = 18_000_000;

type ResearchFile = { path: string; name: string; size: number };

type DocBlock = {
  type: "document";
  source: { type: "base64"; media_type: "application/pdf"; data: string };
  title: string;
};

// ── Prompts ────────────────────────────────────────────────────────────────────

const BRIEF_STRUCTURE = `
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
Up to 5 direct quotes from the documents most relevant to compliance assessment. Format: "Quote..." — [Source document name]`.trim();

const FIRST_BATCH_PROMPT = (companyName: string, fileNames: string[]) => `
You are a senior EU AI Act compliance analyst at LexSutra.

The admin has uploaded ${fileNames.length} research document(s) about "${companyName}" (batch 1 of several):
${fileNames.map((n, i) => `  ${i + 1}. ${n}`).join("\n")}

Analyse these documents and produce a structured RESEARCH BRIEF. More documents will follow in subsequent batches — you will be asked to extend and refine this brief then. Write for AI comprehension — be specific, cite source documents, avoid filler.

Structure your brief exactly as follows:

${BRIEF_STRUCTURE}

Keep the entire brief under 800 words. Be factual and precise.
`.trim();

const EXTEND_BATCH_PROMPT = (companyName: string, fileNames: string[], batchNum: number, totalBatches: number, runningBrief: string) => `
You are a senior EU AI Act compliance analyst at LexSutra.

You previously analysed earlier documents about "${companyName}" and produced this research brief:

---
${runningBrief}
---

Now analyse ${fileNames.length} additional document(s) (batch ${batchNum} of ${totalBatches}):
${fileNames.map((n, i) => `  ${i + 1}. ${n}`).join("\n")}

Update the research brief by incorporating any new evidence from these documents. Keep the same structure. If new documents add new AI systems, compliance evidence, or verbatim quotes, include them. If they confirm existing findings, note the additional source. Replace "No public evidence found" entries where new evidence exists.

${BRIEF_STRUCTURE}

Keep the entire brief under 1000 words. Be factual and precise.
`.trim();

// ── POST /api/admin/demo-research/summarise ────────────────────────────────────

export async function POST(req: NextRequest) {
  const adminClient = createSupabaseAdminClient();

  try {
    const { demoId } = await req.json() as { demoId: string };
    if (!demoId) return NextResponse.json({ error: "Missing demoId." }, { status: 400 });

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

    // Download each PDF and convert to base64
    const loadedBlocks: { block: DocBlock; name: string }[] = [];
    const skipped: string[] = [];

    for (const f of files) {
      try {
        const { data, error } = await adminClient.storage.from(BUCKET).download(f.path);
        if (error || !data) { skipped.push(f.name); continue; }

        const b64 = Buffer.from(await data.arrayBuffer()).toString("base64");
        loadedBlocks.push({
          name: f.name,
          block: {
            type:   "document",
            source: { type: "base64", media_type: "application/pdf", data: b64 },
            title:  f.name,
          },
        });
      } catch {
        skipped.push(f.name);
      }
    }

    if (loadedBlocks.length === 0) {
      return NextResponse.json({ error: "Could not read any of the uploaded files." }, { status: 500 });
    }

    // Group into batches — each batch ≤ MAX_BATCH_CHARS of base64
    const batches: { block: DocBlock; name: string }[][] = [];
    let currentBatch: typeof loadedBlocks = [];
    let currentChars = 0;

    for (const item of loadedBlocks) {
      const chars = item.block.source.data.length;
      if (currentChars + chars > MAX_BATCH_CHARS && currentBatch.length > 0) {
        batches.push(currentBatch);
        currentBatch = [item];
        currentChars = chars;
      } else {
        currentBatch.push(item);
        currentChars += chars;
      }
    }
    if (currentBatch.length > 0) batches.push(currentBatch);

    // Process each batch, building up the running brief
    let brief = "";
    let totalRead = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch     = batches[i];
      const batchNames = batch.map((e) => e.name);
      const prompt    = i === 0
        ? FIRST_BATCH_PROMPT(demo.company_name, batchNames)
        : EXTEND_BATCH_PROMPT(demo.company_name, batchNames, i + 1, batches.length, brief);

      const message = await anthropic.messages.create({
        model:      "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [{
          role:    "user",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: [...batch.map((e) => e.block) as any[], { type: "text", text: prompt }],
        }],
      });

      brief = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();

      totalRead += batch.length;
    }

    await adminClient.from("demo_requests").update({ research_brief: brief }).eq("id", demoId);

    return NextResponse.json({
      success: true,
      brief,
      filesRead:    totalRead,
      filesSkipped: skipped,
      batches:      batches.length,
    });

  } catch (err) {
    await logError({ error: err, source: "api/admin/demo-research/summarise", action: "POST", metadata: {} });
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Summarisation failed: ${msg}` }, { status: 500 });
  }
}
