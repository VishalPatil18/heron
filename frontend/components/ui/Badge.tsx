import type { HTMLAttributes } from "react";

type Variant = "success" | "new" | "beta";

// badge-* per DESIGN.md: caption-bold, pill, tight padding.
const variants: Record<Variant, string> = {
  success: "bg-success-bg text-success-text",
  new: "bg-brand-coral text-canvas",
  beta: "bg-brand-blue-200 text-brand-blue-deep",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({
  variant = "success",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full text-caption font-semibold px-2.5 py-1 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
