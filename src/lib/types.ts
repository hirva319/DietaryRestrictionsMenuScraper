export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export type Category =
  | "vegetarian"
  | "vegan"
  | "vegan_with_modification"
  | "ask_server"
  | "avoid";

export interface MenuItem {
  name: string;
  category: Category;
  description: string;
  note: string | null;
  price: string | null;
}

export interface ClassificationSummary {
  total_items: number;
  vegetarian_count: number;
  vegan_count: number;
  vegan_modifiable_count: number;
  ask_server_count: number;
  avoid_count: number;
  top_picks: string[];
}

export interface ClassificationResult {
  items: MenuItem[];
  summary: ClassificationSummary;
}

export type AppStep = "input" | "searching" | "extracting" | "classifying" | "results" | "error";
