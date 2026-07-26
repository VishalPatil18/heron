"use client";

import { motion, useReducedMotion } from "motion/react";
import { fusionMetrics } from "@/lib/benchmarks";

// Fusion-model metrics as horizontal bars. Each fill animates 0→value on
// scroll-into-view (matching StatsStrip's whileInView pattern).
export function MetricBars() {
  const reduce = useReducedMotion();

  return (
    <div className="space-y-5">
      {fusionMetrics.map((m) => (
        <div key={m.label}>
          <div className="flex items-baseline justify-between">
            <span className="text-body-sm text-charcoal">{m.label}</span>
            <span className="text-body-sm font-semibold text-ink tabular-nums">
              {m.display}
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-soft">
            <motion.div
              className="h-full rounded-full bg-brand-coral"
              initial={{ width: reduce ? `${m.value}%` : 0 }}
              whileInView={{ width: `${m.value}%` }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
