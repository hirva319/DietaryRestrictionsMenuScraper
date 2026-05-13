import { MenuItem, Category, ClassificationResult } from "./types";

// ── Keyword dictionaries ──

const MEAT_KEYWORDS = [
  "beef", "steak", "ribeye", "sirloin", "filet mignon", "t-bone", "brisket",
  "prime rib", "short rib", "braised short rib", "veal", "lamb", "mutton",
  "pork", "bacon", "ham", "sausage", "salami", "pepperoni", "prosciutto",
  "pancetta", "chorizo", "bratwurst", "hot dog", "kielbasa",
  "chicken", "turkey", "duck", "goose", "quail", "pheasant", "cornish hen",
  "poultry", "wings", "drumstick", "thigh", "breast",
  "venison", "bison", "elk", "rabbit", "boar",
  "meatball", "meatloaf", "meat sauce", "bolognese", "ragu", "meat",
  "pulled pork", "carnitas", "al pastor", "carne asada", "barbacoa",
  "pastrami", "corned beef", "bresaola", "mortadella", "sopressata",
  "liver", "tongue", "oxtail", "tripe", "sweetbreads",
  "gyro", "kebab", "shawarma", "kofta", "kofte",
  "skirt steak", "flank steak", "filet", "tenderloin", "wagyu",
  "roast beef", "pot roast", "rack of lamb", "lamb chop",
  "pork chop", "pork belly", "bone-in", "bone in",
  "primal", "charcuterie", "deli meat", "cured meat",
  "buffalo chicken", "fried chicken",
];

const SEAFOOD_KEYWORDS = [
  "fish", "salmon", "tuna", "cod", "halibut", "tilapia", "trout", "bass",
  "swordfish", "mahi", "snapper", "catfish", "anchovy", "anchovies", "sardine",
  "mackerel", "herring", "grouper", "perch", "walleye", "pike", "sole",
  "flounder", "monkfish", "sea bass", "striped bass", "chilean sea bass",
  "shrimp", "prawn", "lobster", "crab", "crawfish", "crayfish",
  "clam", "mussel", "oyster", "scallop", "squid", "calamari", "octopus",
  "sushi", "sashimi", "poke",
  "seafood", "surf and turf",
  "ahi", "unagi", "eel", "caviar", "roe", "ikura", "tobiko",
  "hamachi", "branzino", "langoustine", "yellowtail", "yellowfin",
  "ceviche", "crudo", "tartare",
  "king crab", "snow crab", "soft shell crab", "crab cake",
  "fish taco", "fish and chips", "fish fry",
  "smoked salmon", "lox", "gravlax",
  "bouillabaisse", "cioppino", "paella",
];

const DAIRY_KEYWORDS = [
  "cheese", "cheddar", "mozzarella", "parmesan", "parmigiano", "swiss",
  "gouda", "brie", "feta", "goat cheese", "ricotta", "provolone",
  "gruyere", "manchego", "burrata", "mascarpone", "queso",
  "cream", "cream sauce", "alfredo", "bechamel",
  "butter", "milk", "yogurt", "sour cream", "creme fraiche",
  "whey", "casein", "ghee",
  "ice cream", "gelato", "whipped cream",
  "labneh", "tzatziki",
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
  "muhammara", "tapenade", "baba ganoush",
  "pistachio", "pomegranate", "lemon", "olive",
  "roasted pepper", "charred eggplant",
];

const HIDDEN_ANIMAL_KEYWORDS = [
  "gelatin", "lard", "suet", "tallow",
  "fish sauce", "oyster sauce", "worcestershire",
  "bone broth", "beef broth", "chicken broth", "chicken stock", "beef stock",
  "demi-glace", "demi glace",
  "rennet",
  "beef jus", "lamb jus", "pork jus",
];

const ASK_SERVER_HINTS = [
  "broth", "stock", "gravy", "dressing",
  "fried", "deep fried",
  "pesto",
  "stir fry", "stir-fry",
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

const SKIP_LINE_PATTERNS = [
  /^---\s*From:/i,
  /^Title:/i,
  /^URL Source:/i,
  /^Markdown Content:/i,
  /^!\[/,
  /^\[.*\]\(.*\)$/,
  /^#{1,6}\s/,
  /^(hours|location|address|phone|tel|fax|www\.|http|follow us|copyright|©|all rights|privacy|terms|\d{3}[-.]\d{3}|download pdf|video of)/i,
  /^\*{3,}$/,
  /^-{3,}$/,
  /^image \d/i,
  /^\[.*download.*\]/i,
  /^served with/i,
  /^choice of/i,
  /^add \$/i,
  /^includes /i,
  /^(please|ask your|may contain|consuming raw)/i,
  /^Signature dishes/i,

  // Website UI / navigation / non-food text
  /^(menu|order|cart|checkout|sign ?in|log ?in|log ?out|sign ?up|register|subscribe)/i,
  /^(search|find|filter|sort|view|show|hide|close|open|expand|collapse|toggle)/i,
  /^(home|about|contact|careers|jobs|press|news|blog|faq|help|support)/i,
  /^(delivery|pickup|takeout|take-out|dine-in|dine in|curbside|drive.thru)/i,
  /^(catering|private|events?|party|parties|gift ?cards?|rewards?|loyalty)/i,
  /^(change location|find a restaurant|near you|nearby|store locator)/i,
  /^(skip to|jump to|go to|back to|return to|scroll)/i,
  /^(waitlist|reservat|book a table|join the wait)/i,
  /^(free delivery|promo|coupon|discount|limited time|special offer)/i,
  /^(follow us|connect|social|instagram|facebook|twitter|tiktok)/i,
  /^(nutrition|calorie|allergen|allergy info)/i,
  /^(loading|please wait|processing)/i,
  /^(read more|learn more|see more|view more|see all|view all|show more)/i,
  /^(accept|decline|allow|deny|cookie|consent)/i,
  /^(prev|next|previous|back|forward|page \d)/i,
  /^(select|choose|pick|customize|modify your)/i,
  /^(minimum|maximum|subtotal|total|tax|tip|fee)/i,
  /^(welcome|hi there|hello|hey)/i,
  /\b(click here|tap here|swipe|download our app)\b/i,
  /^(we are|we're|now open|currently|temporarily)/i,
  /^(mon|tue|wed|thu|fri|sat|sun)(day)?[\s,:-]/i,
  /^\d{1,2}:\d{2}\s*(am|pm)/i,
  /^\d{1,2}\s*(am|pm)\s*[-–]\s*\d{1,2}\s*(am|pm)/i,
];

const PRICE_PATTERN = /(?:^|\s)\$?\d{1,3}(?:[.,]\d{2})?\s*$/;
const STANDALONE_PRICE = /^\$?\d{1,3}(?:[.,]\d{2})?$/;
const SECTION_HEADER = /^#{1,6}\s+(.+)$/;

const DIETARY_MARKERS = /(?:,?\s*)?\b(?:vegan|vgn|vg|gf|gluten[- ]?free|df|dairy[- ]?free|nf|nut[- ]?free|contains nuts)\b(?:\s*,?\s*)/gi;
const TRAILING_MARKERS = /[.,\s]*(VGN|VG|GF|DF|NF|V)(?:[,\s]+(VGN|VG|GF|DF|NF|V))*\s*$/;

function cleanDietaryMarkers(name: string): string {
  let cleaned = name.replace(DIETARY_MARKERS, " ");

  const trailingMatch = cleaned.match(TRAILING_MARKERS);
  if (trailingMatch) {
    cleaned = cleaned.slice(0, trailingMatch.index).trim();
  }

  return cleaned.replace(/\s{2,}/g, " ").trim();
}

function extractMenuItems(text: string): RawItem[] {
  const items: RawItem[] = [];
  const seen = new Set<string>();

  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (SKIP_LINE_PATTERNS.some((p) => p.test(line))) continue;

    if (SECTION_HEADER.test(line)) continue;

    if (STANDALONE_PRICE.test(line)) continue;

    if (line.length < 3 || line.length > 200) continue;

    const priceMatch = line.match(PRICE_PATTERN);
    let name = line;
    let price: string | null = null;

    if (priceMatch) {
      price = priceMatch[0].trim();
      if (!price.startsWith("$")) price = "$" + price;
      name = line.slice(0, line.length - priceMatch[0].length).trim();
    }

    name = cleanDietaryMarkers(name);

    if (name.length < 2 || name.length > 120) continue;
    if (/^\d+$/.test(name)) continue;

    let description = "";

    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];

      if (STANDALONE_PRICE.test(nextLine)) {
        price = nextLine.trim();
        if (!price.startsWith("$")) price = "$" + price;
        i++;
      }

      if (i + 1 < lines.length) {
        const descCandidate = lines[i + 1];
        const isDesc =
          !STANDALONE_PRICE.test(descCandidate) &&
          !SECTION_HEADER.test(descCandidate) &&
          !SKIP_LINE_PATTERNS.some((p) => p.test(descCandidate)) &&
          descCandidate.length > 5 &&
          descCandidate.length < 300 &&
          /^[a-z]/.test(descCandidate);

        if (isDesc) {
          description = descCandidate;
          i++;

          if (i + 1 < lines.length && STANDALONE_PRICE.test(lines[i + 1])) {
            price = lines[i + 1].trim();
            if (!price.startsWith("$")) price = "$" + price;
            i++;
          }
        }
      }
    }

    const key = normalize(name);
    if (seen.has(key)) continue;

    if (!looksLikeFood(name, description, price)) continue;

    seen.add(key);
    items.push({ name, description, price });
  }

  return items;
}

const ALL_FOOD_KEYWORDS = [
  ...MEAT_KEYWORDS, ...SEAFOOD_KEYWORDS, ...DAIRY_KEYWORDS,
  ...EGG_KEYWORDS, ...VEGAN_SAFE_KEYWORDS, ...HIDDEN_ANIMAL_KEYWORDS,
  ...ASK_SERVER_HINTS,
  "grilled", "roasted", "baked", "steamed", "seared", "smoked", "crispy",
  "braised", "sauteed", "sautéed", "glazed", "marinated", "stuffed",
  "soup", "salad", "sandwich", "burger", "wrap", "bowl", "plate",
  "appetizer", "entree", "dessert", "cocktail", "wine",
  "pan-seared", "wood-fired", "charred", "blackened", "poached",
  "truffle", "garlic", "herb", "spicy", "sweet", "tangy", "savory",
  "seasonal", "house-made", "housemade", "hand-cut", "fresh",
  "served with", "topped with", "drizzled",
  "aioli", "vinaigrette", "reduction", "glaze", "compote", "jam",
  "side", "add-on", "upgrade",
  "mezze", "flatbread", "bruschetta", "crostini", "tartare",
  "taco", "burrito", "quesadilla", "enchilada", "tamale",
  "ramen", "pho", "pad thai", "lo mein", "fried rice",
  "tikka", "masala", "tandoori", "biryani", "dal",
  "panini", "ciabatta", "focaccia", "croissant", "baguette",
  "smoothie", "latte", "espresso", "tea", "juice",
  "cake", "pie", "tart", "brownie", "cookie", "pudding", "mousse",
  "cheesecake", "tiramisu", "baklava", "churro", "donut",
];

function looksLikeFood(name: string, description: string, price: string | null): boolean {
  if (price) return true;

  const combined = `${name} ${description}`;

  if (containsAny(combined, ALL_FOOD_KEYWORDS)) return true;

  if (/^\d/.test(name)) return false;
  if (name.split(/\s+/).length <= 1 && name.length < 8) return false;
  if (/^[A-Z\s]+$/.test(name) && name.split(/\s+/).length <= 2 && !containsAny(name, ALL_FOOD_KEYWORDS)) return false;

  return false;
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
