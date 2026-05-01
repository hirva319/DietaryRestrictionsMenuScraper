import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (status ${response.status})` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const buffer = await response.arrayBuffer();
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const textResult = await parser.getText();
      await parser.destroy();
      return NextResponse.json({
        text: textResult.text.slice(0, 15000),
        source: url,
        type: "pdf",
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $("script, style, nav, footer, header, iframe, noscript").remove();

    const menuSelectors = [
      '[class*="menu"]',
      '[id*="menu"]',
      '[class*="food"]',
      '[class*="dish"]',
      '[class*="item"]',
      "main",
      "article",
      ".content",
      "#content",
    ];

    let menuText = "";
    for (const selector of menuSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((_, el) => {
          menuText += $(el).text() + "\n";
        });
      }
    }

    if (menuText.trim().length < 100) {
      menuText = $("body").text();
    }

    const cleaned = menuText
      .replace(/\s+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 15000);

    return NextResponse.json({
      text: cleaned,
      source: url,
      type: "html",
    });
  } catch (err) {
    console.error("Extract error:", err);
    return NextResponse.json(
      { error: "Failed to extract menu content" },
      { status: 500 }
    );
  }
}
