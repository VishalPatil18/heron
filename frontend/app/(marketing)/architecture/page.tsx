import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";

const workflow = [
  {
    step: "1",
    title: "Parse",
    body: "The email is parsed from .html, .eml, or pasted text - visible text is extracted, markup stripped, and hyperlink patterns and HTML statistics computed.",
  },
  {
    step: "2",
    title: "Extract logos",
    body: "Inline brand logos are decoded from the HTML. Remote image URLs are deliberately not fetched - that would be an SSRF risk on a public endpoint - so only embedded images feed the image tower; no logo means a zero-filled tensor.",
  },
  {
    step: "3",
    title: "Preprocess",
    body: "Text is tokenized against the training vocabulary and padded or truncated to 512 tokens; images are resized to 224×224 and ImageNet-normalized; 20 metadata features are extracted and scaled.",
  },
  {
    step: "4",
    title: "Fuse",
    body: "The three towers run, their outputs concatenate into an 832-d vector, and the fusion classifier produces two class logits.",
  },
  {
    step: "5",
    title: "Verdict",
    body: "A softmax turns those logits into phishing vs legitimate with a 0–100% confidence, alongside readable signals - shortened URLs, suspicious domains, urgency language - surfaced from the metadata.",
  },
];

const designDecisions = [
  {
    title: "Dual-tower with learned fusion",
    body: "Modalities are combined with learned weights, not a fixed rule, so the model adapts per email instead of blindly averaging text and image.",
  },
  {
    title: "Graded confidence, not a binary flag",
    body: "Every verdict carries a 0–100% score, so the threshold can be tuned for recall vs precision, high-confidence phishing triaged first, and drift watched when confidence drops.",
  },
  {
    title: "In-process model, HTML-native input",
    body: "The model runs inside the FastAPI service and consumes raw HTML the way it arrives in an inbox - no separate serving tier and no manual pre-cleaning.",
  },
  {
    title: "No remote image fetch",
    body: "Only inline images are decoded; fetching arbitrary URLs from user uploads on a public endpoint is an SSRF risk. Missing images degrade gracefully to a zero tensor.",
  },
];

const modelDecisions = [
  {
    title: "Two-stage training: freeze → fine-tune",
    body: "Each tower is pretrained alone, frozen to train the fusion head on stable features, then unfrozen for end-to-end fine-tuning at a low 1e-4 rate - cutting training time and avoiding catastrophic forgetting.",
  },
  {
    title: "Custom CNNs, with a ResNet18 baseline",
    body: "The towers are custom 1-D and 2-D CNNs. A pretrained ResNet18 (97.43%) was benchmarked for logos, but the fusion model keeps the custom towers so both can be fine-tuned jointly.",
  },
  {
    title: "A 20-feature metadata channel",
    body: "URL counts, domain-mismatch flags, urgency keywords and formatting stats give the classifier evidence that pure text or image analysis overlooks.",
  },
  {
    title: "Batch-norm + dropout 0.5",
    body: "Heavy regularization across the 832→512→256→128→2 head keeps a high-capacity model from overfitting - the text tower holds 98.96% validation against 99.93% train.",
  },
];

export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-16 lg:py-24">
      <div className="max-w-4xl">
        <span className="text-caption font-semibold uppercase tracking-[0.08em] text-brand-coral">
          Architecture
        </span>
        <h1 className="text-heading-lg text-ink mt-3">
          How Heron reads an email
        </h1>
        <p className="text-body-md text-steel mt-4 text-justify">
          Heron is a multimodal phishing detector. It reads an email&apos;s text
          and looks at its embedded brand logos at the same time, then fuses
          both, plus a set of engineered metadata signals into a single verdict.
          Here is the whole system, from the browser to the model and back.
        </p>
      </div>

      <div className="mt-12 max-w-4xl space-y-10">
        <section>
          <h2 className="text-heading-sm text-ink">The application</h2>
          <p className="text-body-md text-charcoal mt-3 text-justify">
            Heron takes an email - pasted, or uploaded as .html or .eml and
            posts it to a FastAPI service. The model runs{" "}
            <span className="text-ink font-medium">in-process</span> inside that
            service, with no separate serving tier, so a request is parsed,
            preprocessed, and classified in a single hop that returns a verdict,
            a confidence score, and the signals that drove it. The service is
            containerized and deployed to Cloud Run; weights are pulled from a
            public Hugging Face repo at startup.
          </p>
        </section>

        <section>
          <h2 className="text-heading-sm text-ink">The model</h2>
          <p className="text-body-md text-charcoal mt-3 text-justify">
            The model is a dual-tower fusion network. Two specialist
            convolutional networks - one for text, one for logo images - are
            each trained on their own, then combined with a small metadata
            network under a fusion classifier. Trained on 76,346 emails and
            72,652 logos across 352 brands, the fused model reaches{" "}
            <span className="text-ink font-medium">99.45% accuracy</span>{" "}
            (ROC-AUC 0.9998) - past either tower alone (text 98.96%, image
            76.30%).
          </p>
          <p className="text-body-md text-charcoal mt-3 text-justify">
            Crucially, the fusion layer learns to weight each modality by how
            reliable it is for a given email: it leans on text when the language
            screams urgency, on the image tower when a logo doesn&apos;t match
            the sender&apos;s domain, and on metadata for edge cases that read
            clean but carry suspicious sender or timing patterns.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-body-sm text-steel">
            <span>
              <span className="text-ink font-semibold">99.45%</span> accuracy
            </span>
            <span>
              <span className="text-ink font-semibold">0.9998</span> ROC-AUC
            </span>
            <span>
              <span className="text-ink font-semibold">23 / 32</span> false
              positives / negatives on ~10k emails
            </span>
          </div>
        </section>
      </div>

      <section className="mt-16">
        <h2 className="text-heading-sm text-ink">The pipeline, end to end</h2>
        <p className="text-body-sm text-steel mt-2 text-justify">
          Hover or tap any block to see what it does and which blocks it feeds.
        </p>
        <div className="mt-6">
          <ArchitectureDiagram />
        </div>
      </section>

      <section className="mt-16 max-w-4xl">
        <h2 className="text-heading-sm text-ink">The complete workflow</h2>
        <ol className="mt-6 space-y-5">
          {workflow.map((w) => (
            <li key={w.step} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-hairline text-body-sm font-semibold text-ink">
                {w.step}
              </span>
              <div>
                <h3 className="text-body-md font-semibold text-ink">
                  {w.title}
                </h3>
                <p className="text-body-sm text-charcoal mt-1 text-justify">
                  {w.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16">
        <h2 className="text-heading-sm text-ink">Key design decisions</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {designDecisions.map((d) => (
            <div
              key={d.title}
              className="rounded-xl border border-hairline p-5"
            >
              <h3 className="text-body-md font-semibold text-ink">{d.title}</h3>
              <p className="text-body-sm text-charcoal mt-2 text-justify">
                {d.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-heading-sm text-ink">Model decisions</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {modelDecisions.map((d) => (
            <div
              key={d.title}
              className="rounded-xl border border-hairline p-5"
            >
              <h3 className="text-body-md font-semibold text-ink">{d.title}</h3>
              <p className="text-body-sm text-charcoal mt-2 text-justify">
                {d.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
