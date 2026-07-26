// "Sentinel" heron - a standing bird (body, curved neck, dagger beak) with a coral
// eye and a coral waterline breaking around the legs; always faces right. The bird
// uses currentColor (ink on light nav, white on the dark footer); coral accents are
// fixed to brand-coral. Colours are Tailwind fill-/stroke- classes, never inline CSS.

interface HeronLogoProps {
  size?: number;
  showWordmark?: boolean;
  tagline?: boolean;
  className?: string;
}

export function HeronLogo({
  size = 30,
  showWordmark = true,
  tagline = false,
  className = "",
}: HeronLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
      >
        <path
          className="fill-current"
          d="M22 45 C13 43 11 33 19 29 C28 25 35 31 35 39 C35 43.5 29 46 22 45 Z"
        />
        <path
          className="stroke-current"
          fill="none"
          strokeWidth="4.6"
          strokeLinecap="round"
          d="M33 35 C33 27 29 24 32 19 C35 14 42 15 43 20"
        />
        <path className="fill-current" d="M41 17 L44 22.5 L60 26 Z" />
        <circle className="fill-brand-coral" cx="39.5" cy="19.5" r="1.9" />
        <path
          className="stroke-current"
          strokeWidth="3.2"
          strokeLinecap="round"
          d="M24 45 L24 54.5"
        />
        <path
          className="stroke-current"
          strokeWidth="3.2"
          strokeLinecap="round"
          d="M30 45 L30 54.5"
        />
        <path
          className="stroke-brand-coral"
          strokeWidth="3.4"
          strokeLinecap="round"
          d="M3 56 H18"
        />
        <path
          className="stroke-brand-coral"
          strokeWidth="3.4"
          strokeLinecap="round"
          d="M36 56 H61"
        />
      </svg>
      {showWordmark && (
        <span className="flex flex-col leading-none text-left">
          <span className="text-[18px] font-semibold tracking-tight">
            Heron
          </span>
          {tagline && (
            <span className="text-[10px] leading-none text-current opacity-60">
              Nothing swims past.
            </span>
          )}
        </span>
      )}
    </span>
  );
}
