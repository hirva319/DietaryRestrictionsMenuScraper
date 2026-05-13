"use client";

import { useState, useCallback } from "react";
import SearchForm from "@/components/SearchForm";
import ProgressStepper from "@/components/ProgressStepper";
import ResultsView from "@/components/ResultsView";
import { AppStep, ClassificationResult } from "@/lib/types";

export default function Home() {
  const [step, setStep] = useState<AppStep>("input");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ClassificationResult | null>(null);
  const [restaurant, setRestaurant] = useState("");

  const analyze = useCallback(async (body: Record<string, string>) => {
    setError(null);
    setResults(null);
    setStep("searching");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Analysis failed");
      }

      const data: ClassificationResult = await res.json();

      if (!data.items || data.items.length === 0) {
        throw new Error("No menu items found. Try a different restaurant.");
      }

      setResults(data);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  }, []);

  const handleSearch = useCallback(
    (restaurantName: string, city: string) => {
      setRestaurant(restaurantName);
      analyze({ restaurant: restaurantName, city });
    },
    [analyze]
  );

  const handleDirectUrl = useCallback(
    (url: string, restaurantName: string) => {
      setRestaurant(restaurantName || "Restaurant");
      analyze({ restaurant: restaurantName, menuUrl: url });
    },
    [analyze]
  );

  const handleReset = () => {
    setStep("input");
    setError(null);
    setResults(null);
    setRestaurant("");
  };

  const isProcessing = step === "searching";

  return (
    <main className="flex-1 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
            <span className="text-3xl">🥦</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Veggie Scout
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-md mx-auto">
            Find vegetarian and vegan options at any restaurant. Search by name or paste a menu link.
          </p>
        </div>

        {(step === "input" || step === "error") && (
          <SearchForm onSearch={handleSearch} onDirectUrl={handleDirectUrl} disabled={false} />
        )}

        {isProcessing && (
          <>
            <SearchForm onSearch={handleSearch} onDirectUrl={handleDirectUrl} disabled={true} />
            <div className="flex flex-col items-center mt-10 space-y-4">
              <div className="flex space-x-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
              <p className="text-emerald-700 font-medium">
                Searching for menu and analyzing items...
              </p>
              <p className="text-sm text-gray-400">This usually takes 5-10 seconds</p>
            </div>
          </>
        )}

        {step === "error" && error && (
          <div className="mt-6 max-w-xl mx-auto bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={handleReset}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {step === "results" && results && (
          <ResultsView data={results} restaurant={restaurant} onReset={handleReset} />
        )}
      </div>

      <footer className="py-6 text-center text-xs text-gray-400">
        Veggie Scout &mdash; Powered by Gemini. Always confirm with your server.
      </footer>
    </main>
  );
}
