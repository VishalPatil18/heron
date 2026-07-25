"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

const stats = [
  { value: 99.45, decimals: 2, suffix: "%", label: "Detection accuracy" },
  { value: 0.999, decimals: 3, label: "AUC-ROC" },
  { value: 76346, decimals: 0, label: "Emails trained on" },
  { value: 352, decimals: 0, label: "Brands recognized" },
];

function Counter({
  value,
  decimals,
  suffix = "",
}: {
  value: number;
  decimals: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduce = useReducedMotion();
  const count = useMotionValue(0);
  const text = useTransform(count, (v) =>
    v.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
  );

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { duration: 1.6, ease: "easeOut" });
    return () => controls.stop();
  }, [inView, reduce, value, count]);

  return (
    <span>
      <motion.span ref={ref}>{text}</motion.span>
      {suffix}
    </span>
  );
}

export function StatsStrip() {
  return (
    <section className="border-y border-hairline">
      <div className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="text-heading-lg text-ink">
                <Counter
                  value={s.value}
                  decimals={s.decimals}
                  suffix={s.suffix}
                />
              </div>
              <div className="text-body-sm text-steel">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
