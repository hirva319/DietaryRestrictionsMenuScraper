import { MenuItem, Category, ClassificationResult } from "./types";

// ── Keyword dictionaries ──

const MEAT_KEYWORDS = [
  "beef", "steak", "ribeye", "sirloin", "filet mignon", "t-bone", "brisket",
  "prime rib", "short rib", "veal", "lamb", "mutton",
  "pork", "bacon", "ham", "sausage", "salami", "pepperoni", "prosciutto",
  "pancetta", "chorizo", "bratwurst", "hot dog",
  "chicken", "turkey", "duck", "goose", "quail", "pheasant", "cornish hen",
  "poultry", "wings", "drumstick", "thigh",
  "venison", "bison", "elk", "rabbit", "boar",
  "meatball", "meatloaf", "meat sauce", "bolognese", "ragu",
  "pulled pork", "carnitas", "al pastor", "carne asada", "barbacoa",
  "pastrami", "corned beef", "bresaola", "mortadella",
  "liver", "tongue", "oxtail", "tripe",
  "gyro", "kebab", "shawarma",
];

const SEAFOOD_KEYWORDS = [
  "fish", "salmon", "tuna", "cod", "halibut", "tilapia", "trout", "bass",
  "swordfish", "mahi", "snapper", "catfish", "anchovy", "anchovies", "sardine",
  "mackerel", "herring",
  "shrimp", "prawn", "lobster", "crab", "crawfish", "crayfish",
  "clam", "mussel", "oyster", "scallop", "squid", "calamari", "octopus",
  "sushi", "sashimi", "poke",
  "seafood", "surf and turf",
  "ahi", "unagi", "eel", "caviar", "roe",
];

const DAIRY_KEYWORDS = [
  "cheese", "cheddar", "mozzarella", "parmesan", "parmigiano", "swiss",
  "gouda", "brie", "feta", "goat cheese", "ricotta", "provolone",
  "gruyere", "manchego", "burrata", "mascarpone", "queso",
  "cream", "cream sauce", "alfredo", "bechamel",
  "butter", "milk", "yogurt", "sour cream", "creme fraiche",
  "whey", "casein", "ghee",
  "ice cream", "gelato", "whipped cream",
];

const EGG_KEYWORDS = [
  "egg", "eggs", "omelette", "omelet", "frittata", "quiche",
  "meringue", "hollandaise", "aioli", "mayo", "mayonnaise",
  "custard", "souffle",
];

const VEGAN_SAFE_KEYWORDS = [
  "tofu", "tempeh", "seitan", "beyond", "impossible",
  "plant-based", "plant based", "vegan",
  "hummus", "falafel", "edamame",
  "avocado", "guacamole",
  "rice", "quinoa", "couscous", "bulgur",
  "beans", "black beans", "kidney beans", "chickpeas", "lentils",
  "vegetables", "veggie", "vegetable", "broccoli", "cauliflower",
  "spinach", "kale", "arugula", "lettuce", "cabbage", "collard",
  "mushroom", "mushrooms", "portobello",
  "corn", "potato", "potatoes", "sweet potato", "fries", "hash browns",
  "tomato", "cucumber", "pepper", "peppers", "onion", "zucchini",
  "eggplant", "artichoke", "asparagus", "beet", "carrot",
  "fruit", "apple", "banana", "berries", "mango", "pineapple",
  "pasta", "spaghetti", "penne", "linguine", "rigatoni", "noodles",
  "bread", "toast", "flatbread", "pita", "naan", "tortilla",
  "salad", "garden salad", "house salad", "side salad",
  "soup", "gazpacho", "minestrone",
  "olive oil", "vinaigrette",
  "nuts", "almonds", "cashews", "walnuts", "peanuts", "pecans",
  "oat milk", "almond milk", "soy milk", "coconut milk",
  "sorbet",
];

const HIDDEN_ANIMAL_KEYWORDS = [
  "gelatin", "lard", "suet", "tallow",
  "fish sauce", "oyster sauce", "worcestershire",
  "bone broth", "beef broth", "chicken broth", "chicken stock", "beef stock",
  "demi-glace", "demi glace",
  "rennet",
];

const ASK_SERVER_HINTS = [
  "broth", "stock", "gravy", "sauce", "dressing",
  "fried", "deep fried",
  "pesto",
  "wrap", "burrito", "taco",
  "stir fry", "stir-fry",
  "curry",
  "risotto",
  "gnocchi",
  "dumpling", "dumplings", "gyoza", "wonton",
  "spring roll", "egg roll",
];

// ── Helpers ──

function normalize(text: string): string {
  return text.toLowerCase().replace(/['']/g, "'").replace(/[""]/g, '"');
}

function containsAny(text: string, keywords: string[]): string | null {
  const lower = normalize(text);
  for (const kw of keywords) {
    const pattern = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "i");
    if (pattern.test(lower)) return kw;
  }
  return null;
}

function classifyItem(name: string, description: string): { category: Category; note: string | null } {
  const combined = `${name} ${description}`;

  const meatMatch = containsAny(combined, MEAT_KEYWORDS);
  if (meatMatch) {
    return { category: "avoid", note: `Contains ${meatMatch}` };
  }

  const seafoodMatch = containsAny(combined, SEAFOOD_KEYWORDS);
  if (seafoodMatch) {
    return { category: "avoid", note: `Contains ${seafoodMatch}` };
  }

  const hiddenMatch = containsAny(combined, HIDDEN_ANIMAL_KEYWORDS);
  if (hiddenMatch) {
    return { category: "avoid", note: `Contains ${hiddenMatch}` };
  }

  const hasDairy = containsAny(combined, DAIRY_KEYWORDS);
  const hasEgg = containsAny(combined, EGG_KEYWORDS);
  const hasVeganIngredient = containsAny(combined, VEGAN_SAFE_KEYWORDS);

  if (hasDairy && hasVeganIngredient) {
    return {
      category: "vegan_with_modification",
      note: `Contains ${hasDairy} — ask to substitute or remove`,
    };
  }

  if (hasEgg && hasVeganIngredient) {
    return {
      category: "vegan_with_modification",
      note: `Contains ${hasEgg} — ask to substitute or remove`,
    };
  }

  if (hasDairy || hasEgg) {
    return { category: "vegetarian", note: null };
  }

  if (hasVeganIngredient) {
    const ambiguousMatch = containsAny(combined, ASK_SERVER_HINTS);
    if (ambiguousMatch) {
      return {
        category: "ask_server",
        note: `Contains ${ambiguousMatch} — ask if it's made with animal products`,
      };
    }
    return { category: "vegan", note: null };
  }

  const ambiguousMatch = containsAny(combined, ASK_SERVER_HINTS);
  if (ambiguousMatch) {
    return {
      category: "ask_server",
      note: `Contains ${ambiguousMatch} — unclear if vegetarian, ask your server`,
    };
  }

  return {
    category: "ask_server",
    note: "Could not determine ingredients — ask your server",
  };
}

// ── Menu text parser ──

interface RawItem {
  name: string;
  description: string;
  price: string | null;
}

function extractMenuItems(text: string): RawItem[] {
  const items: RawItem[] = [];
  const seen = new Set<string>();

  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const pricePattern = /\$\s?[\d]+(?:[.,]\d{2})?/;
  const sectionHeaders = /^(appetizer|entree|entre|main|dessert|side|beverage|drink|soup|salad|sandwich|pizza|burger|pasta|seafood|breakfast|lunch|dinner|brunch|starters?|mains?|sweets?|specials?|shareables?|small plates?|large plates?|from the (?:grill|oven|sea|garden))s?\s*$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (sectionHeaders.test(line)) continue;
    if (line.length < 3 || line.length > 200) continue;
    if (/^(?:hours|location|address|phone|tel|fax|www\.|http|follow us|copyright|©|\d{3}[-.]\d{3})/i.test(line)) continue;

    const priceMatch = line.match(pricePattern);
    let name = line;
    let price: string | null = null;

    if (priceMatch) {
      price = priceMatch[0];
      name = line.replace(pricePattern, "").replace(/[.\s]+$/, "").trim();
    }

    if (name.length < 3 || name.length > 120) continue;
    if (/^\d+$/.test(name)) continue;

    let description = "";
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const looksLikeDescription =
        !pricePattern.test(nextLine) &&
        !sectionHeaders.test(nextLine) &&
        nextLine.length > 10 &&
        nextLine.length < 300 &&
        /^[a-z]/.test(nextLine);

      if (looksLikeDescription) {
        description = nextLine;
        i++;
      }
    }

    const key = normalize(name);
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({ name, description, price });
  }

  return items;
}

// ── Public API ──

export function classifyMenuText(menuText: string, _restaurant: string): ClassificationResult {
  const rawItems = extractMenuItems(menuText);

  const items: MenuItem[] = rawItems.map((raw) => {
    const { category, note } = classifyItem(raw.name, raw.description);
    return {
      name: raw.name,
      category,
      description: raw.description || raw.name,
      note,
      price: raw.price,
    };
  });

  const counts = { vegetarian: 0, vegan: 0, vegan_with_modification: 0, ask_server: 0, avoid: 0 };
  for (const item of items) {
    counts[item.category]++;
  }

  const safePicks = items
    .filter((i) => i.category === "vegan" || i.category === "vegetarian")
    .slice(0, 3)
    .map((i) => i.name);

  return {
    items,
    summary: {
      total_items: items.length,
      vegetarian_count: counts.vegetarian,
      vegan_count: counts.vegan,
      vegan_modifiable_count: counts.vegan_with_modification,
      ask_server_count: counts.ask_server,
      avoid_count: counts.avoid,
      top_picks: safePicks,
    },
  };
}
