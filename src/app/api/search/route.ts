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

    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Search API not configured. Set SERPER_API_KEY in environment variables." },
        { status: 500 }
      );
    }

    const query = `${restaurant} ${city} menu`;

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
      let detail = "Search failed";
      try {
        const parsed = JSON.parse(errBody);
        detail = parsed?.message || detail;
      } catch {
        // use default
      }
      return NextResponse.json({ error: detail }, { status: 502 });
    }

    const data = await response.json();

    const results = (data.organic || []).map(
      (item: { title: string; link: string; snippet: string }) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet || "",
      })
    );

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
