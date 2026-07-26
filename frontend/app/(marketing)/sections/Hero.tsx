import { Button } from "@/components/ui/Button";
import { HeroScene } from "./HeroScene";

export function Hero() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-brand-coral border bg-brand-coral/10 border-brand-coral rounded-full px-3 py-1">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-brand-coral opacity-75 animate-ping" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-brand-coral" />
            </span>
            Phishing defense · live
          </span>
          <h1 className="text-body-md sm:text-heading-sm font-bold">
            One click is all it takes. <br />
            <span className="text-brand-coral text-heading-md sm:text-display-lg font-black">
              Heron catches it before you do.
            </span>
          </h1>
          <p className="text-body-md text-steel max-w-xl text-justify">
            Watch a routine inbox turn into a breach in fifteen seconds, then
            watch Heron catch it. Drop in any email and get an instant verdict,
            with the signals that gave it away.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href="/dashboard" variant="primary">
              Scan an email
            </Button>
            <Button href="/benchmarks" variant="secondary">
              See the benchmarks
            </Button>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <HeroScene />
        </div>
      </div>
    </section>
  );
}
