import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

async function extractWithJina(url: string): Promise<string | null> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Accept: "text/plain",
        "X-Return-Format": "text",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) return null;

    const text = await response.text();
    if (text.length < 100) return null;

    return text.slice(0, 15000);
  } catch {
    return null;
  }
}

async function extractWithCheerio(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const buffer = await response.arrayBuffer();
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const textResult = await parser.getText();
      await parser.destroy();
      return textResult.text.slice(0, 15000);
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

    return cleaned.length >= 100 ? cleaned : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Try Jina AI reader first (handles JS-rendered pages)
    let text = await extractWithJina(url);
    let type = "jina";

    // Fall back to direct Cheerio scraping
    if (!text) {
      text = await extractWithCheerio(url);
      type = "html";
    }

    if (!text) {
      return NextResponse.json(
        { error: "Could not extract content from this page" },
        { status: 502 }
      );
    }

    return NextResponse.json({ text, source: url, type });
  } catch (err) {
    console.error("Extract error:", err);
    return NextResponse.json(
      { error: "Failed to extract menu content" },
      { status: 500 }
    );
  }
}
