# Veggie Scout

Find vegetarian and vegan options at any restaurant. Enter a restaurant name and city, and Veggie Scout uses AI to search the web for the menu and classify every dish.

## How It Works

1. Enter a restaurant name + city (or paste a menu URL)
2. Gemini AI searches the web, finds the menu, and classifies every item:
   - **Vegan** — No animal products
   - **Vegetarian** — No meat/fish (dairy and eggs OK)
   - **Vegan with Modification** — Can be made vegan (tells you what to ask)
   - **Ask Server** — Unclear ingredients, worth asking about
   - **Avoid** — Contains meat, poultry, or fish
3. See your best options with top picks and filtering

## Setup

### 1. Get a free Gemini API key

Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and create a key. No credit card needed.

### 2. Install and run

```bash
npm install
cp .env.example .env.local
# Edit .env.local and paste your Gemini API key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start searching.

## Deploy to Vercel

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add environment variable: `GEMINI_API_KEY` = your key
4. Deploy

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS**
- **Google Gemini 2.0 Flash** with Google Search grounding
