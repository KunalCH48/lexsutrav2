import { fetchWebsite } from "./fetch-website";

export type FootprintSources = {
  websiteQuality: "good" | "partial" | "failed";
  newsCount:      number;
  linkedInFound:  boolean;
  linkedInJobsFound: boolean;
  crunchbaseFound: boolean;
};

export type PublicFootprintResult = {
  content:      string;
  quality:      "good" | "partial" | "failed";
  pagesScanned: number;
  sources:      FootprintSources;
};

// ── Config ────────────────────────────────────────────────────────────────────

const JINA_TIMEOUT_MS  = 10_000;
const NEWS_TIMEOUT_MS  =  8_000;
const MAX_NEWS_ITEMS   = 8;
const MAX_LINKEDIN_CHARS    = 4_000;
const MAX_CRUNCHBASE_CHARS  = 3_000;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchText(url: string, timeoutMs: number): Promise<string> {
  const ctrl = new AbortController();
  const t    = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal:  ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LexSutra-Assessment/1.0; +https://lexsutra.com)" },
    });
    clearTimeout(t);
    return res.ok ? await res.text() : "";
  } catch {
    clearTimeout(t);
    return "";
  }
}

async function fetchViaJina(url: string, maxChars: number, timeoutMs = JINA_TIMEOUT_MS): Promise<string> {
  const ctrl = new AbortController();
  const t    = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      signal:  ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LexSutra-Assessment/1.0; +https://lexsutra.com)",
        Accept: "text/plain,text/markdown,*/*",
      },
    });
    clearTimeout(t);
    return res.ok ? (await res.text()).trim().slice(0, maxChars) : "";
  } catch {
    clearTimeout(t);
    return "";
  }
}

function isLoginWall(text: string): boolean {
  const s = text.slice(0, 600).toLowerCase();
  return (
    s.includes("sign in to") ||
    s.includes("log in to") ||
    s.includes("join linkedin") ||
    s.includes("create an account") ||
    s.includes("please sign in") ||
    s.includes("you must be logged")
  );
}

function parseNewsRss(xml: string): { title: string; source: string; date: string; snippet: string }[] {
  const items: { title: string; source: string; date: string; snippet: string }[] = [];
  for (const [, itemXml] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const extract = (tag: string) =>
      itemXml
        .match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]
        ?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
        .trim() ?? "";

    const title   = extract("title");
    const source  = extract("source");
    const date    = extract("pubDate");
    const snippet = extract("description").slice(0, 300);

    if (title && title.length > 10) {
      items.push({ title, source, date, snippet });
      if (items.length >= MAX_NEWS_ITEMS) break;
    }
  }
  return items;
}

function formatNewsDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function companyToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function fetchPublicFootprint(
  websiteUrl:  string,
  companyName: string,
): Promise<PublicFootprintResult> {
  const slug = companyToSlug(companyName);
  const enc  = encodeURIComponent;

  // All sources fetched in parallel
  const [
    websiteResult,
    newsXml1,
    newsXml2,
    linkedInRaw,
    linkedInJobsRaw,
    crunchbaseRaw,
  ] = await Promise.all([
    fetchWebsite(websiteUrl),
    // News: AI / compliance angle
    fetchText(
      `https://news.google.com/rss/search?q=${enc(`"${companyName}" (AI OR compliance OR regulation)`)}&hl=en-GB&gl=GB&ceid=GB:en`,
      NEWS_TIMEOUT_MS,
    ),
    // News: funding / business angle
    fetchText(
      `https://news.google.com/rss/search?q=${enc(`"${companyName}" (funding OR raised OR million OR investment)`)}&hl=en-GB&gl=GB&ceid=GB:en`,
      NEWS_TIMEOUT_MS,
    ),
    fetchViaJina(`https://www.linkedin.com/company/${slug}/`, MAX_LINKEDIN_CHARS),
    fetchViaJina(`https://www.linkedin.com/company/${slug}/jobs/`, MAX_LINKEDIN_CHARS / 2),
    fetchViaJina(`https://www.crunchbase.com/organization/${slug}`, MAX_CRUNCHBASE_CHARS),
  ]);

  // Parse and deduplicate news
  const seenTitles = new Set<string>();
  const allNews = [...parseNewsRss(newsXml1), ...parseNewsRss(newsXml2)].filter(item => {
    if (seenTitles.has(item.title)) return false;
    seenTitles.add(item.title);
    return true;
  }).slice(0, MAX_NEWS_ITEMS);

  // Discard login walls / empty responses
  const linkedIn      = linkedInRaw      && !isLoginWall(linkedInRaw)      && linkedInRaw.length      > 200 ? linkedInRaw      : "";
  const linkedInJobs  = linkedInJobsRaw  && !isLoginWall(linkedInJobsRaw)  && linkedInJobsRaw.length  > 200 ? linkedInJobsRaw  : "";
  const crunchbase    = crunchbaseRaw    && !isLoginWall(crunchbaseRaw)    && crunchbaseRaw.length    > 200 ? crunchbaseRaw    : "";

  // Build structured content for Claude
  const sections: string[] = [];

  if (websiteResult.content) {
    sections.push(
      `=== COMPANY WEBSITE (scan quality: ${websiteResult.quality.toUpperCase()}, ${websiteResult.pagesScanned} pages) ===\n${websiteResult.content}`,
    );
  }

  if (allNews.length > 0) {
    const newsText = allNews
      .map(n =>
        `• [${formatNewsDate(n.date)}] ${n.title}\n  Source: ${n.source || "Unknown"}\n  ${n.snippet}`,
      )
      .join("\n\n");
    sections.push(`=== NEWS & MEDIA COVERAGE (${allNews.length} articles found) ===\n${newsText}`);
  }

  if (linkedIn) {
    sections.push(`=== LINKEDIN COMPANY PROFILE ===\n${linkedIn}`);
  }

  if (linkedInJobs) {
    sections.push(`=== LINKEDIN JOB POSTINGS ===\n${linkedInJobs}`);
  }

  if (crunchbase) {
    sections.push(`=== CRUNCHBASE COMPANY PROFILE ===\n${crunchbase}`);
  }

  const content = sections.join("\n\n").trim();

  const quality: "good" | "partial" | "failed" =
    websiteResult.quality === "good" ? "good"
    : (websiteResult.quality === "partial" || allNews.length > 0 || !!linkedIn || !!crunchbase) ? "partial"
    : "failed";

  const pagesScanned =
    websiteResult.pagesScanned +
    (allNews.length > 0 ? 1 : 0) +
    (linkedIn      ? 1 : 0) +
    (linkedInJobs  ? 1 : 0) +
    (crunchbase    ? 1 : 0);

  return {
    content,
    quality,
    pagesScanned,
    sources: {
      websiteQuality:   websiteResult.quality,
      newsCount:        allNews.length,
      linkedInFound:    !!linkedIn,
      linkedInJobsFound: !!linkedInJobs,
      crunchbaseFound:  !!crunchbase,
    },
  };
}
