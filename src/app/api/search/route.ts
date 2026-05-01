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

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    if (!apiKey || !cx) {
      return NextResponse.json(
        { error: "Search API not configured. Set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX." },
        { status: 500 }
      );
    }

    const query = `${restaurant} ${city} menu`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5`;

    const response = await fetch(url);
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
      return NextResponse.json(
        { error: detail },
        { status: 502 }
      );
    }

    const data = await response.json();

    const results = (data.items || []).map(
      (item: { title: string; link: string; snippet: string }) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
      })
    );

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
