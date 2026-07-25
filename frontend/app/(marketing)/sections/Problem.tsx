const points = [
  {
    title: "Cheaper",
    body: "Generative models spin up flawless phishing kits for pennies - no skill required.",
  },
  {
    title: "Faster",
    body: "A convincing, personalized lure is now seconds of work, not hours.",
  },
  {
    title: "More convincing",
    body: "Pixel-perfect brand clones and fluent copy slip straight past text-only filters.",
  },
];

export function Problem() {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-[1280px] px-6 py-20 space-y-10">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-heading-lg">AI supercharged phishing.</h2>
          <p className="text-body-md text-steel">
            The same models that write your emails now write the scams. Three
            things changed at once.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {points.map((p) => (
            <div key={p.title} className="space-y-2">
              <h3 className="text-card-title">{p.title}</h3>
              <p className="text-body-sm text-steel">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
