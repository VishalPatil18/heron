// Heron in flight - arched wings with the head between them and legs trailing.
// Mono, uses currentColor so the parent sets the color (ink on nav, white on footer).

interface HeronLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function HeronLogo({
  size = 30,
  showWordmark = true,
  className = "",
}: HeronLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M24 27 C 18 21, 12 15, 5 13"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M24 27 C 30 21, 36 15, 43 13"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="24" cy="24" r="2.1" fill="currentColor" />
        <path
          d="M24 27 L 22 36"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M24 27 L 26 36"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark && (
        <span className="text-[20px] font-semibold tracking-tight leading-none">
          Heron
        </span>
      )}
    </span>
  );
}
