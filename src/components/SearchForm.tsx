"use client";

import { useState } from "react";

interface SearchFormProps {
  onSearch: (restaurant: string, city: string) => void;
  disabled: boolean;
}

export default function SearchForm({ onSearch, disabled }: SearchFormProps) {
  const [restaurant, setRestaurant] = useState("");
  const [city, setCity] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (restaurant.trim() && city.trim()) {
      onSearch(restaurant.trim(), city.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto space-y-4">
      <div>
        <label
          htmlFor="restaurant"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
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
        <label
          htmlFor="city"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
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
      <button
        type="submit"
        disabled={disabled || !restaurant.trim() || !city.trim()}
        className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {disabled ? "Analyzing..." : "Find Veggie Options"}
      </button>
    </form>
  );
}
