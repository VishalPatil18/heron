"use client";

import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import type { PredictResponse, Severity } from "@/lib/api";
import { Button } from "@/components/ui/Button";

const severityChip: Record<Severity, string> = {
  high: "bg-brand-coral/10 text-brand-coral",
  medium: "bg-surface-soft text-charcoal",
  low: "bg-surface-soft text-steel",
};

const RADIUS = 52;
const CIRC = 2 * Math.PI * RADIUS;

// Coral for phishing, green (success token) for legitimate.
function ConfidenceRing({
  confidence,
  phishing,
}: {
  confidence: number;
  phishing: boolean;
}) {
  const reduce = useReducedMotion();
  const progress = useMotionValue(0);
  const offset = useTransform(progress, (p) => CIRC * (1 - p));
  const percent = useTransform(progress, (p) => `${Math.round(p * 100)}%`);
  const color = phishing ? "var(--color-brand-coral)" : "var(--color-success-text)";

  useEffect(() => {
    if (reduce) {
      progress.set(confidence);
      return;
    }
    const controls = animate(progress, confidence, {
      duration: 1.1,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [confidence, reduce, progress]);

  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          className="stroke-hairline"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={CIRC}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="text-heading-sm text-ink">{percent}</motion.span>
        <span className="text-caption text-steel">confidence</span>
      </div>
    </div>
  );
}

export function ResultCard({
  result,
  onReset,
}: {
  result: PredictResponse;
  onReset: () => void;
}) {
  const phishing = result.verdict === "phishing";

  return (
    <div className="rounded-xl border border-hairline p-6">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <ConfidenceRing confidence={result.confidence} phishing={phishing} />
        <div className="flex-1 text-center sm:text-left">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-caption font-semibold ${
              phishing
                ? "bg-brand-coral text-canvas"
                : "bg-success-bg text-success-text"
            }`}
          >
            {phishing ? "Phishing" : "Legitimate"}
          </span>
          <h2 className="text-heading-sm text-ink mt-3">
            {phishing
              ? "This email looks like phishing."
              : "This email looks legitimate."}
          </h2>
          <p className="text-body-sm text-steel mt-1">
            {result.meta.images_found} image
            {result.meta.images_found === 1 ? "" : "s"} ·{" "}
            {result.meta.body_chars.toLocaleString("en-US")} characters analyzed
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-hairline pt-6">
        <h3 className="text-body-sm font-semibold text-ink">Detected signals</h3>
        {result.signals.length === 0 ? (
          <p className="text-body-sm text-steel mt-2">
            No phishing signals detected.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {result.signals.map((s) => (
              <li key={s.code} className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-xs px-2 py-0.5 text-micro font-semibold uppercase tracking-wide ${severityChip[s.severity]}`}
                >
                  {s.severity}
                </span>
                <span className="text-body-sm text-charcoal">{s.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <Button variant="secondary" onClick={onReset}>
          Scan another
        </Button>
      </div>
    </div>
  );
}
