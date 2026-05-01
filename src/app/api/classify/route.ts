import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { menuText, restaurant } = await req.json();

    if (!menuText) {
      return NextResponse.json(
        { error: "Menu text is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Set OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const prompt = `You are a dietary analysis expert. Analyze this restaurant menu text and classify every identifiable food item for vegetarian and vegan diners.

Restaurant: ${restaurant || "Unknown"}

Menu text:
${menuText.slice(0, 12000)}

For each item you find, classify it into ONE of these categories:
- "vegetarian" — no meat, poultry, or fish (eggs and dairy OK)
- "vegan" — no animal products at all
- "vegan_with_modification" — could be made vegan with a simple modification (specify what to ask)
- "ask_server" — unclear ingredients, worth asking about
- "avoid" — contains meat, poultry, or fish

Return a JSON object with this exact structure:
{
  "items": [
    {
      "name": "Item Name",
      "category": "vegetarian|vegan|vegan_with_modification|ask_server|avoid",
      "description": "Brief description of the dish",
      "note": "Optional note (e.g. what modification to request, or why to ask server)",
      "price": "Price if visible, or null"
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
}

Focus on accuracy. If you're unsure whether something contains meat-based broth or hidden animal products (like gelatin, lard, anchovy paste), classify as "ask_server". Only return valid JSON, nothing else.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 502 }
      );
    }

    const classification = JSON.parse(content);
    return NextResponse.json(classification);
  } catch (err) {
    console.error("Classify error:", err);
    return NextResponse.json(
      { error: "Failed to classify menu items" },
      { status: 500 }
    );
  }
}
