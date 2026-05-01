"use client";

import { ClassificationResult, Category, MenuItem } from "@/lib/types";
import { useState } from "react";

const categoryConfig: Record<
  Category,
  { label: string; color: string; bgColor: string; emoji: string }
> = {
  vegan: {
    label: "Vegan",
    color: "text-green-800",
    bgColor: "bg-green-100 border-green-300",
    emoji: "🌱",
  },
  vegetarian: {
    label: "Vegetarian",
    color: "text-emerald-800",
    bgColor: "bg-emerald-100 border-emerald-300",
    emoji: "🥬",
  },
  vegan_with_modification: {
    label: "Vegan w/ Mod",
    color: "text-amber-800",
    bgColor: "bg-amber-100 border-amber-300",
    emoji: "✏️",
  },
  ask_server: {
    label: "Ask Server",
    color: "text-blue-800",
    bgColor: "bg-blue-100 border-blue-300",
    emoji: "❓",
  },
  avoid: {
    label: "Avoid",
    color: "text-red-800",
    bgColor: "bg-red-100 border-red-300",
    emoji: "🚫",
  },
};

const filterOptions: { key: Category | "all" | "safe"; label: string }[] = [
  { key: "all", label: "All Items" },
  { key: "safe", label: "Safe to Eat" },
  { key: "vegan", label: "Vegan" },
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan_with_modification", label: "Modifiable" },
  { key: "ask_server", label: "Ask Server" },
];

interface ResultsViewProps {
  data: ClassificationResult;
  restaurant: string;
  onReset: () => void;
}

function ItemCard({ item }: { item: MenuItem }) {
  const config = categoryConfig[item.category];
  return (
    <div
      className={`rounded-xl border p-4 ${config.bgColor} transition-all hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{config.emoji}</span>
            <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
          {item.note && (
            <p className="text-xs italic text-gray-500 bg-white/60 rounded-lg px-3 py-1.5">
              {item.note}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${config.color} bg-white/70`}
          >
            {config.label}
          </span>
          {item.price && (
            <span className="text-sm font-medium text-gray-700">{item.price}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultsView({ data, restaurant, onReset }: ResultsViewProps) {
  const [filter, setFilter] = useState<Category | "all" | "safe">("safe");

  const filtered = data.items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "safe")
      return ["vegan", "vegetarian", "vegan_with_modification"].includes(
        item.category
      );
    return item.category === filter;
  });

  const safeCount =
    data.summary.vegetarian_count +
    data.summary.vegan_count +
    data.summary.vegan_modifiable_count;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Summary card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">{restaurant}</h2>
          <button
            onClick={onReset}
            className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition cursor-pointer"
          >
            Search another
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatBox label="Safe Options" value={safeCount} color="text-emerald-600" />
          <StatBox label="Vegan" value={data.summary.vegan_count} color="text-green-600" />
          <StatBox label="Ask Server" value={data.summary.ask_server_count} color="text-blue-600" />
          <StatBox label="Total Items" value={data.summary.total_items} color="text-gray-600" />
        </div>

        {data.summary.top_picks.length > 0 && (
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <h3 className="text-sm font-semibold text-emerald-800 mb-2">
              Top Picks for You
            </h3>
            <ul className="space-y-1">
              {data.summary.top_picks.map((pick, i) => (
                <li key={i} className="text-sm text-emerald-700 flex items-center gap-2">
                  <span className="text-emerald-500">&#10003;</span>
                  {pick}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.method && (
          <div className="mt-3 text-xs text-gray-400 text-right">
            Analyzed using{" "}
            {data.method === "ai" ? (
              <span className="text-emerald-600 font-medium">AI (GPT-4o-mini)</span>
            ) : (
              <span className="text-amber-600 font-medium">
                keyword analysis (no API key set)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
              filter === opt.key
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
            }`}
          >
            {opt.label}
            <span className="ml-1.5 opacity-70">
              (
              {opt.key === "all"
                ? data.items.length
                : opt.key === "safe"
                ? safeCount
                : data.items.filter((i) => i.category === opt.key).length}
              )
            </span>
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No items in this category.
          </div>
        ) : (
          filtered.map((item, index) => <ItemCard key={index} item={item} />)
        )}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
