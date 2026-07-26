import { ModelTable } from "@/components/benchmarks/ModelTable";
import { MetricBars } from "@/components/benchmarks/MetricBars";

export default function BenchmarksPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 lg:py-24">
      <div className="max-w-4xl">
        <span className="text-caption font-semibold uppercase tracking-[0.08em] text-brand-coral">
          Benchmarks
        </span>
        <h1 className="text-heading-lg text-ink mt-3">
          The numbers behind Heron
        </h1>
        <p className="text-body-md text-steel mt-4 text-justify">
          Six models were trained and compared across two modalities - text and
          logo images on a balanced dataset of 76,346 emails. The dual-tower
          fusion model tops them all at 99.45% accuracy, past the best single
          modality.
        </p>
      </div>

      <section className="mt-14 max-w-4xl">
        <h2 className="text-heading-sm text-ink">Model comparison</h2>
        <p className="text-body-sm text-steel mt-2 text-justify">
          Traditional baselines (KNN, Logistic Regression) against the custom
          CNN specialists, a ResNet18 transfer-learning baseline, and the fused
          model that combines them.
        </p>
        <div className="mt-6">
          <ModelTable />
        </div>
      </section>

      <section className="mt-16 max-w-4xl">
        <h2 className="text-heading-sm text-ink">Fusion model metrics</h2>
        <p className="text-body-sm text-steel mt-2 text-justify">
          Precision, recall and F1 are reported on the phishing class, the
          costliest to miss, evaluated on the held-out validation split.
        </p>
        <div className="mt-8">
          <MetricBars />
        </div>
      </section>
    </div>
  );
}
