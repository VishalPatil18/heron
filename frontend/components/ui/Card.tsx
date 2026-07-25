import type { HTMLAttributes } from "react";

type Variant = "base" | "hero";

// DESIGN.md signature: 16px white cards vs 32px vibrant gradient cards.
const variants: Record<Variant, string> = {
  base: "bg-canvas rounded-xl p-6 border border-hairline",
  hero: "bg-brand-coral text-canvas rounded-hero p-8",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export function Card({ variant = "base", className = "", ...props }: CardProps) {
  return <div className={`${variants[variant]} ${className}`} {...props} />;
}
