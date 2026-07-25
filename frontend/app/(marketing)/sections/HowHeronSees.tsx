const modalities = [
  {
    title: "Reads the text",
    body: "A text CNN weighs language, urgency, and vocabulary - 256 signals from the words alone.",
  },
  {
    title: "Sees the logos",
    body: "An image CNN catches visual brand impersonation in embedded logos - 512 features.",
  },
  {
    title: "Weighs the metadata",
    body: "20 engineered signals - shortened URLs, caps, suspicious domains - distilled to 64.",
  },
];

export function HowHeronSees() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-20 space-y-10">
      <div className="max-w-2xl space-y-3">
        <h2 className="text-heading-lg">How Heron sees an email.</h2>
        <p className="text-body-md text-steel">
          Three specialists look at the same email from different angles, then
          fuse into one decision.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {modalities.map((m) => (
          <div key={m.title} className="rounded-xl bg-surface p-8 space-y-2">
            <h3 className="text-card-title">{m.title}</h3>
            <p className="text-body-sm text-steel">{m.body}</p>
          </div>
        ))}
      </div>
      <p className="text-body-sm text-stone">
        832 fused features become a phishing-or-legitimate verdict with a
        confidence score.
      </p>
    </section>
  );
}
