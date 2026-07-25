import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary";

// Pill buttons per DESIGN.md; no-hover policy — pressed uses :active, not :hover.
const base =
  "inline-flex items-center justify-center rounded-full text-button-md px-6 py-[11px] transition-colors disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-canvas active:bg-charcoal disabled:bg-hairline disabled:text-muted",
  secondary: "bg-transparent text-ink border border-ink",
  tertiary: "bg-canvas text-ink border border-hairline",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}
