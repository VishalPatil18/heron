"use client";

import { useState } from "react";
import Link from "next/link";
import { HeronLogo } from "./HeronLogo";

const links = [
  { label: "Product", href: "/" },
  { label: "Benchmarks", href: "/benchmarks" },
  { label: "Architecture", href: "/architecture" },
  { label: "Research", href: "/research" },
  { label: "Team", href: "/team" },
];

// CTA is a navigation link styled as the primary pill (button-primary in DESIGN.md).
// Kept inline rather than wrapping <Button> (a <button> inside <a> is invalid HTML).
const primaryPill =
  "inline-flex items-center justify-center rounded-full text-button-md px-6 py-[11px] bg-ink text-canvas active:bg-charcoal transition-colors";

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-canvas border-b border-hairline-soft">
      <nav className="mx-auto max-w-[1280px] px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-ink" onClick={() => setOpen(false)}>
          <HeronLogo tagline />
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          <ul className="flex items-center gap-6">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-body-sm text-charcoal">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/dashboard" className={primaryPill}>
            Scan an email
          </Link>
        </div>

        <button
          type="button"
          className="lg:hidden text-ink"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {open ? (
              <>
                <path d="M6 6 L18 18" />
                <path d="M18 6 L6 18" />
              </>
            ) : (
              <>
                <path d="M4 7 h16" />
                <path d="M4 12 h16" />
                <path d="M4 17 h16" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-hairline-soft bg-canvas px-6 py-4 space-y-4">
          <ul className="space-y-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block text-body-md text-charcoal"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard"
            className={`${primaryPill} w-full`}
            onClick={() => setOpen(false)}
          >
            Scan an email
          </Link>
        </div>
      )}
    </header>
  );
}
