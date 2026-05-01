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

    const apiKey = process.env.key;
    const cx = process.env.GOOGLE_SEARCH_CX;

    if (!apiKey || !cx) {
      return NextResponse.json(
        { error: "Search API not configured. Set key and GOOGLE_SEARCH_CX." },
        { status: 500 }
      );
    }

    const query = `${restaurant} ${city} menu`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5`;

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Google Search API error:", errBody);
      let detail = "Search API request failed";
      try {
        const parsed = JSON.parse(errBody);
        detail = parsed?.error?.message || detail;
      } catch {
        // use default message
      }
      return NextResponse.json({ error: detail }, { status: 502 });
    }

    const data = await response.json();

    const results = (data.items || []).map(
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
