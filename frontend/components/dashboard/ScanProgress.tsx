"use client";

import { useEffect, useState } from "react";

// Cosmetic staged loader. The backend is a single request, so the stages are
// timed for feedback and reveal the result when the promise resolves upstream.
const stages = [
  "Parsing email",
  "Reading text",
  "Inspecting logos",
  "Fusing signals",
];

export function ScanProgress() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => Math.min(i + 1, stages.length - 1));
    }, 650);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-full min-h-[280px] flex-col justify-center rounded-xl border border-hairline p-8">
      <ul className="space-y-3">
        {stages.map((stage, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <li key={stage} className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-caption ${
                  done
                    ? "bg-success-bg text-success-text"
                    : current
                      ? "border-2 border-brand-coral border-t-transparent animate-spin"
                      : "border border-hairline"
                }`}
              >
                {done ? "✓" : ""}
              </span>
              <span
                className={`text-body-sm ${
                  done || current ? "text-ink" : "text-stone"
                }`}
              >
                {stage}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 space-y-2">
        <div className="h-3 w-3/4 animate-pulse rounded bg-surface-soft" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-surface-soft" />
      </div>
    </div>
  );
}
