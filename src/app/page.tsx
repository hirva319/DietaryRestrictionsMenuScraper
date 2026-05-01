"use client";

import { useState, useCallback } from "react";
import SearchForm from "@/components/SearchForm";
import ProgressStepper from "@/components/ProgressStepper";
import ResultsView from "@/components/ResultsView";
import { AppStep, ClassificationResult, SearchResult } from "@/lib/types";

export default function Home() {
  const [step, setStep] = useState<AppStep>("input");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ClassificationResult | null>(null);
  const [restaurant, setRestaurant] = useState("");

  const handleSearch = useCallback(async (restaurantName: string, city: string) => {
    setRestaurant(restaurantName);
    setError(null);
    setResults(null);

    try {
      // Step 1: Search for menu
      setStep("searching");
      const searchRes = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant: restaurantName, city }),
      });

      if (!searchRes.ok) {
        const errData = await searchRes.json();
        throw new Error(errData.error || "Search failed");
      }

      const { results: searchResults } = (await searchRes.json()) as {
        results: SearchResult[];
      };

      if (!searchResults || searchResults.length === 0) {
        throw new Error("No menu results found. Try a different restaurant name or city.");
      }

      // Step 2: Extract menu content from top results
      setStep("extracting");

      let menuText = "";
      const urlsToTry = searchResults.slice(0, 3);

      for (const result of urlsToTry) {
        try {
          const extractRes = await fetch("/api/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: result.url }),
          });

          if (extractRes.ok) {
            const extractData = await extractRes.json();
            if (extractData.text && extractData.text.length > 50) {
              menuText += `\n--- From: ${result.title} (${result.url}) ---\n${extractData.text}\n`;
            }
          }
        } catch {
          // skip failed extractions, try next URL
        }
      }

      if (menuText.length < 100) {
        menuText = searchResults
          .map((r) => `${r.title}: ${r.snippet}`)
          .join("\n\n");

        if (menuText.length < 50) {
          throw new Error("Could not extract enough menu data. The restaurant's menu may not be available online.");
        }
      }

      // Step 3: Classify with AI
      setStep("classifying");
      const classifyRes = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuText, restaurant: restaurantName }),
      });

      if (!classifyRes.ok) {
        const errData = await classifyRes.json();
        throw new Error(errData.error || "Classification failed");
      }

      const classification: ClassificationResult = await classifyRes.json();

      if (!classification.items || classification.items.length === 0) {
        throw new Error("No menu items could be identified. Try a different restaurant.");
      }

      setResults(classification);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  }, []);

  const handleReset = () => {
    setStep("input");
    setError(null);
    setResults(null);
    setRestaurant("");
  };

  const isProcessing = ["searching", "extracting", "classifying"].includes(step);

  return (
    <main className="flex-1 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
            <span className="text-3xl">🥦</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Veggie Scout
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-md mx-auto">
            Find vegetarian and vegan options at any restaurant. Just enter the name and city.
          </p>
        </div>

        {/* Search Form */}
        {(step === "input" || step === "error") && (
          <SearchForm onSearch={handleSearch} disabled={false} />
        )}

        {isProcessing && (
          <>
            <SearchForm onSearch={handleSearch} disabled={true} />
            <ProgressStepper currentStep={step} />
          </>
        )}

        {/* Error */}
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

        {/* Results */}
        {step === "results" && results && (
          <ResultsView data={results} restaurant={restaurant} onReset={handleReset} />
        )}
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400">
        Veggie Scout &mdash; AI-powered menu analysis. Always confirm with your server.
      </footer>
    </main>
  );
}
