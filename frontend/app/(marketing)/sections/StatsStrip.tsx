const stats = [
  { value: "99.45%", label: "Detection accuracy" },
  { value: "0.999", label: "AUC-ROC" },
  { value: "76,346", label: "Emails trained on" },
  { value: "352", label: "Brands recognized" },
];

export function StatsStrip() {
  return (
    <section className="border-y border-hairline">
      <div className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="text-heading-lg text-ink">{s.value}</div>
              <div className="text-body-sm text-steel">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
