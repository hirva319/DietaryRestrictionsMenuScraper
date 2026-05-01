import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

async function googleSearch(restaurant: string, city: string) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  if (!apiKey || !cx) return null;

  const query = `${restaurant} ${city} menu`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  return (data.items || []).map(
    (item: { title: string; link: string; snippet: string }) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
    })
  );
}

async function scrapeDuckDuckGo(restaurant: string, city: string) {
  const query = `${restaurant} ${city} menu`;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) return null;

  const html = await response.text();
  const $ = cheerio.load(html);

  const results: { title: string; url: string; snippet: string }[] = [];

  $(".result").each((_, el) => {
    const titleEl = $(el).find(".result__a");
    const snippetEl = $(el).find(".result__snippet");
    const href = titleEl.attr("href") || "";

    let resolvedUrl = href;
    if (href.includes("uddg=")) {
      try {
        const parsed = new URL(href, "https://duckduckgo.com");
        resolvedUrl = decodeURIComponent(parsed.searchParams.get("uddg") || href);
      } catch {
        resolvedUrl = href;
      }
    }

    if (titleEl.text() && resolvedUrl) {
      results.push({
        title: titleEl.text().trim(),
        url: resolvedUrl,
        snippet: snippetEl.text().trim(),
      });
    }
  });

  return results.length > 0 ? results.slice(0, 5) : null;
}

async function scrapeGoogleSearch(restaurant: string, city: string) {
  const query = `${restaurant} ${city} menu`;
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) return null;

  const html = await response.text();
  const $ = cheerio.load(html);

  const results: { title: string; url: string; snippet: string }[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const match = href.match(/\/url\?q=(https?:\/\/[^&]+)/);
    if (match) {
      const decoded = decodeURIComponent(match[1]);
      if (
        !decoded.includes("google.com") &&
        !decoded.includes("youtube.com") &&
        !decoded.includes("webcache")
      ) {
        const title = $(el).text().trim();
        if (title && title.length > 3 && title.length < 200) {
          results.push({
            title,
            url: decoded,
            snippet: "",
          });
        }
      }
    }
  });

  const seen = new Set<string>();
  const unique = results.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  return unique.length > 0 ? unique.slice(0, 5) : null;
}

export async function POST(req: NextRequest) {
  try {
    const { restaurant, city } = await req.json();

    if (!restaurant || !city) {
      return NextResponse.json(
        { error: "Restaurant name and city are required" },
        { status: 400 }
      );
    }

    // Try Google Custom Search API first
    let results = await googleSearch(restaurant, city);

    // Fall back to DuckDuckGo scraping
    if (!results) {
      console.log("Google API unavailable, trying DuckDuckGo...");
      results = await scrapeDuckDuckGo(restaurant, city);
    }

    // Fall back to Google web scraping
    if (!results) {
      console.log("DuckDuckGo failed, trying Google scrape...");
      results = await scrapeGoogleSearch(restaurant, city);
    }

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: "Could not find menu results. Try pasting a menu URL directly." },
        { status: 404 }
      );
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      { error: "Search failed. Try pasting a menu URL directly." },
      { status: 500 }
    );
  }
}
