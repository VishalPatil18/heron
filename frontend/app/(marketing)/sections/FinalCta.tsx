import { Button } from "@/components/ui/Button";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-20">
      <div className="rounded-hero bg-brand-coral text-canvas px-8 py-16 text-center space-y-5 sm:px-16">
        <h2 className="text-heading-lg max-w-2xl mx-auto">
          Catch the phish before you click.
        </h2>
        <p className="text-subtitle max-w-xl mx-auto opacity-90">
          Paste an email or drop an .html / .eml file. Heron returns a verdict in
          seconds.
        </p>
        <Button href="/dashboard" variant="tertiary">
          Scan an email
        </Button>
      </div>
    </section>
  );
}
