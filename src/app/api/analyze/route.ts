import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

async function callGemini(
  ai: GoogleGenAI,
  prompt: string,
  useSearch: boolean
): Promise<string> {
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: useSearch ? [{ googleSearch: {} }] : [],
          temperature: 0.2,
        },
      });
      return response.text || "";
    } catch (err) {
      lastError = err;
      console.error(`Model ${model} failed:`, err instanceof Error ? err.message : err);
    }
  }

  throw lastError;
}

async function extractWithJina(url: string): Promise<string | null> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: "text/plain", "X-Return-Format": "text" },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) return null;

    const text = await response.text();
    return text.length >= 100 ? text.slice(0, 30000) : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { restaurant, city, menuUrl } = await req.json();

    if (!restaurant && !menuUrl) {
      return NextResponse.json(
        { error: "Restaurant name or menu URL is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured. Get a free key at aistudio.google.com/apikey" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Step 1: Find menu URLs (skip if user provided one)
    let menuUrls: string[] = [];

    if (menuUrl) {
      menuUrls = [menuUrl];
    } else {
      const findPrompt = `Search for the menu of "${restaurant}" restaurant in ${city}. 
Find URLs that contain the actual food menu with item names and prices.
Look for the restaurant's official website menu page, Yelp menu page, or other menu sources.

Return ONLY a JSON array of up to 2 best menu URLs, nothing else. Example:
["https://yelp.com/menu/example", "https://example.com/menu"]
Prefer Yelp, Allmenus, or other menu aggregator sites over the restaurant's own site.`;

      const urlResponse = await callGemini(ai, findPrompt, true);

      const urlMatch = urlResponse.match(/\[[\s\S]*?\]/);
      if (urlMatch) {
        try {
          const parsed = JSON.parse(urlMatch[0]);
          menuUrls = parsed.filter((u: unknown) => typeof u === "string" && u.startsWith("http"));
        } catch {
          // fall through
        }
      }
    }

    // Step 2: Extract full menu text from URLs (in parallel)
    const extractions = await Promise.all(
      menuUrls.slice(0, 2).map((url) => extractWithJina(url))
    );

    let menuText = extractions
      .filter((t): t is string => t !== null)
      .join("\n")
      .slice(0, 30000);

    // Step 3: Classify with Gemini
    let classifyPrompt: string;

    if (menuText.length > 200) {
      classifyPrompt = `You are a dietary analysis expert. Here is the full menu text from "${restaurant || "a restaurant"}".

MENU TEXT:
${menuText.slice(0, 25000)}

Identify EVERY food item on this menu. Do not skip any items. For each item, classify it for vegetarian and vegan diners.`;
    } else {
      classifyPrompt = `You are a dietary analysis expert. Search the web and find the complete menu for "${restaurant}" in ${city}.

Find ALL menu items — appetizers, entrees, sides, desserts, everything. Do not skip any items.`;
    }

    classifyPrompt += `

Classify each item into ONE category:
- "vegan" — no animal products at all
- "vegetarian" — no meat, poultry, or fish (eggs and dairy OK)
- "vegan_with_modification" — could be made vegan with a simple change (specify what to ask)
- "ask_server" — unclear ingredients or has options, worth asking about
- "avoid" — contains meat, poultry, or fish

Watch for hidden non-vegetarian ingredients:
- Broths (chicken/beef stock in soups, rice, beans)
- Sauces (fish sauce, oyster sauce, Worcestershire, anchovy in Caesar dressing)
- Gelatin in desserts, lard in tortillas/refried beans
- Rennet in cheese, bone char in sugar

Return ONLY valid JSON with this structure:
{
  "restaurant_name": "Full restaurant name",
  "items": [
    {
      "name": "Item Name",
      "category": "vegan|vegetarian|vegan_with_modification|ask_server|avoid",
      "description": "Brief description of the dish",
      "note": "What modification to request, why to ask server, or null",
      "price": "Price if found, or null"
    }
  ],
  "summary": {
    "total_items": 0,
    "vegetarian_count": 0,
    "vegan_count": 0,
    "vegan_modifiable_count": 0,
    "ask_server_count": 0,
    "avoid_count": 0,
    "top_picks": ["Top 3 recommended items for vegetarians"]
  }
}`;

    const useSearch = menuText.length < 200;
    const classifyResponse = await callGemini(ai, classifyPrompt, useSearch);

    const jsonMatch = classifyResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Gemini response (no JSON):", classifyResponse.slice(0, 500));
      return NextResponse.json(
        { error: "Could not parse results. Try again." },
        { status: 502 }
      );
    }

    const classification = JSON.parse(jsonMatch[0]);

    if (!classification.items || classification.items.length === 0) {
      return NextResponse.json(
        { error: "No menu items found. Try pasting a menu URL directly." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ...classification, method: "gemini" });
  } catch (err) {
    console.error("Analyze error:", err);
    const message = err instanceof Error ? err.message : "Analysis failed";
    if (message.includes("quota") || message.includes("429")) {
      return NextResponse.json(
        { error: "Gemini API quota exceeded. Enable billing at aistudio.google.com (free tier still applies)." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
