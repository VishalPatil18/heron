import { Button } from "@/components/ui/Button";
import { HeronLogo } from "@/components/HeronLogo";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 py-20">
      <div className="rounded-hero bg-ink text-canvas px-8 py-16 sm:px-16 flex flex-col items-center text-center gap-6">
        <HeronLogo tagline />
        <h2 className="text-heading-lg max-w-2xl">
          Heron would&apos;ve <span className="text-brand-coral">caught</span>{" "}
          this.
        </h2>
        <p className="text-body-md text-muted max-w-xl">
          Spoofed sender, lookalike domain, credential-harvest form.
          <br />
          Heron reads the signals and calls it before you click.
        </p>
        <Button href="/dashboard" variant="tertiary">
          Scan an email
        </Button>
      </div>
    </section>
  );
}
