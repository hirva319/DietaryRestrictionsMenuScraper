import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { restaurant, city } = await req.json();

    if (!restaurant || !city) {
      return NextResponse.json(
        { error: "Restaurant name and city are required" },
        { status: 400 }
      );
    }

    const serperKey = process.env.SERPER_API_KEY;
    const googleKey = process.env.GOOGLE_SEARCH_API_KEY;
    const googleCx = process.env.GOOGLE_SEARCH_CX;

    const query = `${restaurant} ${city} menu`;

    // Try Serper (preferred — free, simple, reliable)
    if (serperKey) {
      const results = await searchSerper(query, serperKey);
      if (results) return NextResponse.json({ results });
    }

    // Fall back to Google Custom Search API
    if (googleKey && googleCx) {
      const results = await searchGoogle(query, googleKey, googleCx);
      if (results) return NextResponse.json({ results });
    }

    return NextResponse.json(
      { error: "Search API not configured. Set SERPER_API_KEY in your environment variables. Get a free key at serper.dev" },
      { status: 500 }
    );
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      { error: "Search failed. Try pasting a menu URL directly." },
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

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Serper API error:", errBody);
      return null;
    }

    const data = await response.json();

    const results = (data.organic || []).map(
      (item: { title: string; link: string; snippet: string }) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet || "",
      })
    );

    return results.length > 0 ? results : null;
  } catch (err) {
    console.error("Serper search failed:", err);
    return null;
  }
}

async function searchGoogle(query: string, apiKey: string, cx: string) {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Google Search API error:", errBody);
      return null;
    }

    const data = await response.json();

    const results = (data.items || []).map(
      (item: { title: string; link: string; snippet: string }) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet || "",
      })
    );

    return results.length > 0 ? results : null;
  } catch (err) {
    console.error("Google search failed:", err);
    return null;
  }
}
