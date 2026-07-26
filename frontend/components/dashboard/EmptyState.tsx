// Idle placeholder for the result region, shown before the first scan.

export function EmptyState() {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-hairline p-8 text-center">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-stone"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
      <p className="text-body-md text-charcoal mt-4">No scan yet</p>
      <p className="text-body-sm text-steel mt-1">
        Drop an email, paste text, or try a sample to get a verdict.
      </p>
    </div>
  );
}
