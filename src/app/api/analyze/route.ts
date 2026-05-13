import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

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

    const searchContext = menuUrl
      ? `the menu at this URL: ${menuUrl}`
      : `the menu for "${restaurant}" restaurant in ${city}`;

    const prompt = `Search the web and find ${searchContext}.

Find as many menu items as possible. For each food item on the menu, classify it for vegetarian and vegan diners.

Classify each item into ONE of these categories:
- "vegan" — no animal products at all
- "vegetarian" — no meat, poultry, or fish (eggs and dairy are OK)
- "vegan_with_modification" — could be made vegan with a simple change (specify what to ask)
- "ask_server" — unclear ingredients or has options, worth asking about
- "avoid" — contains meat, poultry, or fish

Be careful about hidden non-vegetarian ingredients like:
- Broths (chicken/beef stock in soups, rice, beans)
- Sauces (fish sauce, oyster sauce, Worcestershire, anchovy in Caesar dressing)
- Gelatin in desserts
- Lard in tortillas/refried beans
- Rennet in cheese

Return ONLY a valid JSON object with this exact structure:
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

    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let response;
    let lastError;

    for (const model of models) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.2,
          },
        });
        break;
      } catch (err) {
        lastError = err;
        console.error(`Model ${model} failed:`, err instanceof Error ? err.message : err);
      }
    }

    if (!response) {
      const msg = lastError instanceof Error ? lastError.message : "All models failed";
      if (msg.includes("quota") || msg.includes("429")) {
        return NextResponse.json(
          { error: "Gemini API quota exceeded. You may need to enable billing at aistudio.google.com (free tier still applies, no charges)." },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const text = response.text || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Gemini response (no JSON found):", text);
      return NextResponse.json(
        { error: "Could not parse menu results. Try again." },
        { status: 502 }
      );
    }

    const classification = JSON.parse(jsonMatch[0]);

    if (!classification.items || classification.items.length === 0) {
      return NextResponse.json(
        { error: "No menu items found. Try a different restaurant or paste a menu URL." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ...classification, method: "gemini" });
  } catch (err) {
    console.error("Analyze error:", err);
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
