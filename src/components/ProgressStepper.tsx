"use client";

import { AppStep } from "@/lib/types";

const steps: { key: AppStep; label: string }[] = [
  { key: "searching", label: "Searching for menu" },
  { key: "extracting", label: "Reading menu" },
  { key: "classifying", label: "Classifying items" },
  { key: "results", label: "Done" },
];

interface ProgressStepperProps {
  currentStep: AppStep;
}

export default function ProgressStepper({ currentStep }: ProgressStepperProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full max-w-xl mx-auto py-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                    isComplete
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500 ring-offset-2"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isComplete ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium text-center transition-colors ${
                    isComplete || isCurrent ? "text-emerald-700" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
                {isCurrent && currentStep !== "results" && (
                  <div className="mt-2 flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 mt-[-1.5rem] transition-colors duration-500 ${
                    isComplete ? "bg-emerald-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
