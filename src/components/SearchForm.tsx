"use client";

import { useState } from "react";

interface SearchFormProps {
  onSearch: (restaurant: string, city: string) => void;
  onDirectUrl: (url: string, restaurant: string) => void;
  disabled: boolean;
}

export default function SearchForm({ onSearch, onDirectUrl, disabled }: SearchFormProps) {
  const [mode, setMode] = useState<"search" | "url">("search");
  const [restaurant, setRestaurant] = useState("");
  const [city, setCity] = useState("");
  const [menuUrl, setMenuUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "search" && restaurant.trim() && city.trim()) {
      onSearch(restaurant.trim(), city.trim());
    } else if (mode === "url" && menuUrl.trim()) {
      onDirectUrl(menuUrl.trim(), restaurant.trim() || "Restaurant");
    }
  };

  const searchValid = restaurant.trim() && city.trim();
  const urlValid = menuUrl.trim() && menuUrl.trim().startsWith("http");

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Mode tabs */}
      <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setMode("search")}
          disabled={disabled}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            mode === "search"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          } disabled:opacity-50`}
        >
          Search by Name
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          disabled={disabled}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            mode === "url"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          } disabled:opacity-50`}
        >
          Paste Menu URL
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "search" ? (
          <>
            <div>
              <label htmlFor="restaurant" className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Name
              </label>
              <input
                id="restaurant"
                type="text"
                value={restaurant}
                onChange={(e) => setRestaurant(e.target.value)}
                placeholder="e.g. Olive Garden"
                disabled={disabled}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New York"
                disabled={disabled}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition disabled:opacity-50"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="menuUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Menu URL
              </label>
              <input
                id="menuUrl"
                type="url"
                value={menuUrl}
                onChange={(e) => setMenuUrl(e.target.value)}
                placeholder="https://restaurant.com/menu"
                disabled={disabled}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="restaurantUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Name <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="restaurantUrl"
                type="text"
                value={restaurant}
                onChange={(e) => setRestaurant(e.target.value)}
                placeholder="e.g. Olive Garden"
                disabled={disabled}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition disabled:opacity-50"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={disabled || (mode === "search" ? !searchValid : !urlValid)}
          className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {disabled ? "Analyzing..." : "Find Veggie Options"}
        </button>
      </form>
    </div>
  );
}
