export type WebsiteFetchResult = {
  content: string;
  quality: "good" | "partial" | "failed";
  pagesScanned: number;
};

// ── Config ────────────────────────────────────────────────────────────────────

const MAX_EXTRA_PAGES   = 6;      // additional pages beyond homepage
const HOME_CHARS        = 6_000;  // max chars kept from homepage
const PAGE_CHARS        = 4_000;  // max chars kept per additional page
const JINA_TIMEOUT_MS   = 12_000;
const HTML_TIMEOUT_MS   = 8_000;

// Pages most likely to contain EU AI Act compliance evidence — ordered by value
const PRIORITY_PATTERNS: { re: RegExp; score: number; label: string }[] = [
  { re: /\/privac/i,                                     score: 10, label: "Privacy Policy"    },
  { re: /\/terms/i,                                      score: 9,  label: "Terms of Service"  },
  { re: /\/about/i,                                      score: 8,  label: "About"             },
  { re: /\/product|\/features|\/solution|\/platform/i,   score: 8,  label: "Product/Features"  },
  { re: /\/careers|\/jobs|\/hiring|\/vacancies/i,        score: 7,  label: "Careers/Jobs"      },
  { re: /\/security|\/trust|\/compliance|\/responsible/i,score: 7,  label: "Security/Trust"    },
  { re: /\/how-it-works|\/technology|\/approach/i,       score: 6,  label: "Technology"        },
  { re: /\/docs|\/documentation|\/developers|\/api/i,    score: 5,  label: "Documentation"     },
  { re: /\/blog|\/news|\/press|\/media|\/insights/i,     score: 4,  label: "Blog/Press"        },
  { re: /\/pricing/i,                                    score: 2,  label: "Pricing"           },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function normaliseUrl(url: string): string {
  if (!url.startsWith("http")) url = `https://${url}`;
  return url.replace(/\/$/, "");
}

async function fetchHtml(url: string, timeoutMs = HTML_TIMEOUT_MS): Promise<string> {
  const ctrl = new AbortController();
  const t    = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal:  ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LexSutra-Assessment/1.0; +https://lexsutra.com)",
        Accept:       "text/html,application/xhtml+xml,*/*;q=0.8",
      },
    });
    clearTimeout(t);
    if (!res.ok) return "";
    return await res.text();
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
        Accept:       "text/plain,text/markdown,*/*",
      },
    });
    clearTimeout(t);
    if (!res.ok) return "";
    return (await res.text()).trim().slice(0, maxChars);
  } catch {
    clearTimeout(t);
    return "";
  }
}

// Extract and score internal links from homepage HTML
function extractPrioritisedLinks(
  html: string,
  baseUrl: string,
): { url: string; label: string; score: number }[] {
  let baseDomain: string;
  try {
    baseDomain = new URL(baseUrl).hostname;
  } catch {
    return [];
  }

  const seen  = new Set<string>();
  const links: { url: string; label: string; score: number }[] = [];

  const hrefMatches = html.matchAll(/href=["']([^"'#?][^"']*?)["']/gi);

  for (const [, href] of hrefMatches) {
    let resolved: URL;
    try {
      resolved = new URL(href, baseUrl);
    } catch {
      continue;
    }

    // Same domain, http/https only, not a file download
    if (
      resolved.hostname !== baseDomain ||
      !["http:", "https:"].includes(resolved.protocol) ||
      /\.(pdf|docx?|xlsx?|png|jpe?g|gif|svg|zip|mp4|webm)$/i.test(resolved.pathname)
    ) continue;

    // Normalise: strip query + fragment
    const clean = resolved.origin + resolved.pathname.replace(/\/$/, "");
    if (seen.has(clean) || clean === baseUrl) continue;
    seen.add(clean);

    let score = 0;
    let label = "";
    for (const p of PRIORITY_PATTERNS) {
      if (p.re.test(resolved.pathname)) {
        score = p.score;
        label = p.label;
        break;
      }
    }
    if (score > 0) links.push({ url: clean, label, score });
  }

  // Sort by score desc, deduplicate by label (keep highest-scoring per label)
  const byLabel = new Map<string, { url: string; label: string; score: number }>();
  for (const link of links.sort((a, b) => b.score - a.score)) {
    if (!byLabel.has(link.label)) byLabel.set(link.label, link);
  }

  return [...byLabel.values()].sort((a, b) => b.score - a.score).slice(0, MAX_EXTRA_PAGES);
}

// Meta tag fallback for when Jina completely fails on the homepage
function extractMeta(html: string): string {
  const parts: string[] = [];
  const tags: [RegExp, string][] = [
    [/<title[^>]*>([^<]+)<\/title>/i,                                                "Title"],
    [/<meta\s+name=["']description["'][^>]+content=["']([^"']+)["']/i,              "Description"],
    [/<meta\s+content=["']([^"']+)["'][^>]+name=["']description["']/i,              "Description"],
    [/<meta\s+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,             "OG Title"],
    [/<meta\s+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,             "OG Title"],
    [/<meta\s+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,       "OG Description"],
    [/<meta\s+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,       "OG Description"],
  ];
  for (const [re, label] of tags) {
    const m = html.match(re);
    if (m?.[1]) {
      const val = m[1].replace(/\s+/g, " ").trim();
      if (val) parts.push(`${label}: ${val}`);
    }
  }
  return parts.join("\n");
}

function scoreQuality(content: string): "good" | "partial" | "failed" {
  const len = content.trim().length;
  if (len > 300) return "good";
  if (len >= 50)  return "partial";
  return "failed";
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function fetchWebsite(rawUrl: string): Promise<WebsiteFetchResult> {
  const baseUrl = normaliseUrl(rawUrl);

  // Step 1 — Fetch homepage HTML (for link extraction) + Jina in parallel
  const [homeHtml, homeJina] = await Promise.all([
    fetchHtml(baseUrl),
    fetchViaJina(baseUrl, HOME_CHARS),
  ]);

  // Step 2 — Discover and score internal links
  const extraLinks = homeHtml
    ? extractPrioritisedLinks(homeHtml, baseUrl)
    : [];

  // Step 3 — Fetch extra pages via Jina in parallel
  const extraResults = await Promise.all(
    extraLinks.map(async ({ url, label }) => {
      const text = await fetchViaJina(url, PAGE_CHARS);
      return text ? { label, text } : null;
    })
  );

  const extraPages = extraResults.filter((r): r is { label: string; text: string } => r !== null);

  // Step 4 — Build combined content
  const sections: string[] = [];

  if (homeJina) {
    sections.push(`=== Homepage ===\n${homeJina}`);
  } else if (homeHtml) {
    // Jina failed — use meta tags as last resort for homepage
    const meta = extractMeta(homeHtml);
    if (meta) sections.push(`=== Homepage (meta tags only) ===\n${meta}`);
  }

  for (const { label, text } of extraPages) {
    sections.push(`=== ${label} ===\n${text}`);
  }

  const content     = sections.join("\n\n").trim();
  const quality     = homeJina
    ? scoreQuality(homeJina)
    : scoreQuality(content);
  const pagesScanned = (homeJina || sections.length > 0 ? 1 : 0) + extraPages.length;

  // Downgrade to "partial" if homepage Jina failed even if extra pages worked
  const finalQuality: WebsiteFetchResult["quality"] =
    !homeJina && extraPages.length > 0 ? "partial"
    : quality === "failed" && extraPages.length > 0 ? "partial"
    : quality;

  return { content, quality: finalQuality, pagesScanned };
}
