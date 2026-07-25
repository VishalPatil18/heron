import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="mx-auto max-w-[1280px] px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="space-y-6">
          <h1 className="text-heading-md sm:text-heading-lg md:text-display-lg lg:text-hero-display">
            Nothing swims past.
          </h1>
          <p className="text-subtitle text-steel max-w-xl">
            AI made phishing cheaper, faster, and more convincing than ever.
            Heron is the watcher on the water - drop in any email and get an
            instant verdict, with the signals that gave it away.
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

        <div className="aspect-[4/3] w-full rounded-hero bg-surface border border-hairline flex items-center justify-center">
          <span className="text-body-sm text-stone">
            Hero animation - Task 7
          </span>
        </div>
      </div>
    </section>
  );
}
