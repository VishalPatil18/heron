import type {
  ButtonHTMLAttributes,
  AnchorHTMLAttributes,
  ReactNode,
} from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "tertiary";

// Pill buttons per DESIGN.md; no-hover policy - pressed uses :active, not :hover.
const base =
  "inline-flex items-center justify-center rounded-full text-button-md px-6 py-[11px] transition-colors disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-canvas active:bg-charcoal disabled:bg-hairline disabled:text-muted",
  secondary: "bg-transparent text-ink border border-ink",
  tertiary: "bg-canvas text-ink border border-hairline",
};

type CommonProps = {
  variant?: Variant;
  className?: string;
  children?: ReactNode;
};

// With `href`, renders a next/link <Link> (valid nav markup); otherwise a <button>.
type Props =
  | (CommonProps & { href: string } & Omit<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        "href" | "className" | "children"
      >)
  | (CommonProps & { href?: never } & Omit<
        ButtonHTMLAttributes<HTMLButtonElement>,
        "className" | "children"
      >);

export function Button({
  variant = "primary",
  className = "",
  href,
  children,
  ...rest
}: Props) {
  const cls = `${base} ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link
        href={href}
        className={cls}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      className={cls}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
