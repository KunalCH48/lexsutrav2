export type WebsiteFetchResult = {
  content: string;
  quality: "good" | "partial" | "failed";
};

// Strategy A: Jina AI Reader — renders JS-heavy SPAs and returns clean markdown
async function fetchViaJina(url: string): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LexSutra-Assessment/1.0; +https://lexsutra.eu)",
        Accept: "text/plain,text/markdown,*/*",
      },
    });
    clearTimeout(t);
    if (!res.ok) return "";
    const text = await res.text();
    return text.trim().slice(0, 8000);
  } catch {
    clearTimeout(t);
    return "";
  }
}

// Strategy B: Meta tag extraction + /about page (fallback for when Jina fails)
async function fetchViaMeta(url: string): Promise<string> {
  const base = url.replace(/\/$/, "");

  async function fetchHtml(target: string): Promise<string> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 7000);
    try {
      const res = await fetch(target, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; LexSutra-Assessment/1.0; +https://lexsutra.eu)",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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

  function extractMeta(html: string): string[] {
    const parts: string[] = [];
    const tags: Array<[RegExp, string]> = [
      [/<title[^>]*>([^<]+)<\/title>/i, "Title"],
      [/<meta\s+name=["']description["'][^>]+content=["']([^"']+)["']/i, "Description"],
      [/<meta\s+content=["']([^"']+)["'][^>]+name=["']description["']/i, "Description"],
      [/<meta\s+property=["']og:title["'][^>]+content=["']([^"']+)["']/i, "OG Title"],
      [/<meta\s+content=["']([^"']+)["'][^>]+property=["']og:title["']/i, "OG Title"],
      [/<meta\s+property=["']og:description["'][^>]+content=["']([^"']+)["']/i, "OG Description"],
      [/<meta\s+content=["']([^"']+)["'][^>]+property=["']og:description["']/i, "OG Description"],
    ];
    for (const [re, label] of tags) {
      const m = html.match(re);
      if (m?.[1]) {
        const val = m[1].replace(/\s+/g, " ").trim();
        if (val) parts.push(`${label}: ${val}`);
      }
    }
    return parts;
  }

  function stripHtml(html: string): string {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z#0-9]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
  }

  const [homeHtml, aboutHtml] = await Promise.all([
    fetchHtml(base),
    fetchHtml(`${base}/about`),
  ]);

  const homeMeta = extractMeta(homeHtml);
  const aboutMeta = extractMeta(aboutHtml);

  // Also strip full text from home page for extra context
  const homeText = homeHtml ? stripHtml(homeHtml) : "";

  const combined = [
    ...[...new Set([...homeMeta, ...aboutMeta])],
    homeText,
  ]
    .filter(Boolean)
    .join("\n")
    .trim()
    .slice(0, 5000);

  return combined;
}

// Classify quality by content length
function scoreQuality(content: string): "good" | "partial" | "failed" {
  const len = content.trim().length;
  if (len > 300) return "good";
  if (len >= 50) return "partial";
  return "failed";
}

export async function fetchWebsite(url: string): Promise<WebsiteFetchResult> {
  // Try Jina first
  const jinaContent = await fetchViaJina(url);
  const jinaQuality = scoreQuality(jinaContent);

  if (jinaQuality === "good") {
    return { content: jinaContent, quality: "good" };
  }

  // Fallback to meta extraction
  const metaContent = await fetchViaMeta(url);
  const metaQuality = scoreQuality(metaContent);

  if (metaQuality !== "failed") {
    // Return best of the two
    const combined = [jinaContent, metaContent]
      .filter(Boolean)
      .join("\n")
      .trim()
      .slice(0, 6000);
    return { content: combined, quality: metaQuality };
  }

  // Both failed — return whatever we have
  const fallback = jinaContent || metaContent;
  return { content: fallback, quality: "failed" };
}
