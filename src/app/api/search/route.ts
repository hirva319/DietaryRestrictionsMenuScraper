import { NextRequest, NextResponse } from "next/server";

const MENU_FRIENDLY_DOMAINS = [
  "yelp.com",
  "allmenus.com",
  "menupages.com",
  "zmenu.com",
  "menuism.com",
  "grubhub.com",
  "doordash.com",
  "ubereats.com",
  "seamless.com",
  "tripadvisor.com",
  "happycow.net",
  "opentable.com",
];

function scoreResult(url: string): number {
  const lower = url.toLowerCase();

  for (const domain of MENU_FRIENDLY_DOMAINS) {
    if (lower.includes(domain)) return 10;
  }

  if (lower.includes("/menu")) return 5;
  if (lower.includes("menu")) return 3;

  return 1;
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

    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Search API not configured. Set SERPER_API_KEY in environment variables." },
        { status: 500 }
      );
    }

    const [mainResults, yelpResults] = await Promise.all([
      searchSerper(`${restaurant} ${city} menu`, apiKey),
      searchSerper(`site:yelp.com ${restaurant} ${city} menu`, apiKey),
    ]);

    const allResults = [...(yelpResults || []), ...(mainResults || [])];

    const seen = new Set<string>();
    const unique = allResults.filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    unique.sort((a, b) => scoreResult(b.url) - scoreResult(a.url));

    const results = unique.slice(0, 5);

    if (results.length === 0) {
      return NextResponse.json(
        { error: "No menu results found. Try a different restaurant name or city." },
        { status: 404 }
      );
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 }
    );
  }
}

async function searchSerper(query: string, apiKey: string) {
  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 5 }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const data = await response.json();

    return (data.organic || []).map(
      (item: { title: string; link: string; snippet: string }) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet || "",
      })
    );
  } catch {
    return null;
  }
}
