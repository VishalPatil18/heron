import Link from "next/link";

const contributions = [
  {
    title: "Comprehensive baseline comparison",
    body: "Six models evaluated across modalities - KNN, Logistic Regression, custom text and image CNNs, and a pretrained ResNet18 - to establish honest performance baselines before fusion.",
  },
  {
    title: "Multimodal fusion architecture",
    body: "A novel dual-tower network that integrates text and image features through learned representations, weighting each modality by its reliability per email.",
  },
  {
    title: "Practical deployment system",
    body: "An end-to-end inference pipeline that processes raw email HTML, extracts the relevant features, and returns a real-time classification with a confidence score.",
  },
];

const references = [
  "Jay Doshi, Kunal Parmar, Raj Sanghavi, Narendra Shekokar. A comprehensive dual-layer architecture for phishing and spam email detection. Computers & Security, Vol. 133, 2023, 103378.",
  "OpenLogo Dataset (2018). QMUL-OpenLogo: Open Logo Detection Challenge. qmul-openlogo.github.io",
  "Simonyan, K., & Zisserman, A. (2015). Very Deep Convolutional Networks for Large-Scale Image Recognition. ICLR.",
  "Zhang, Y., & Wallace, B. (2015). A Sensitivity Analysis of (and Practitioners' Guide to) Convolutional Neural Networks for Sentence Classification. arXiv:1510.03820.",
  "N. A. Alam. Phishing email dataset. Kaggle.",
];

const pillPrimary =
  "inline-flex items-center justify-center rounded-full text-button-md px-6 py-[11px] bg-ink text-canvas active:bg-charcoal transition-colors";

export default function ResearchPage() {
  return (
    <article className="mx-auto max-w-4xl px-6 py-16 lg:py-24">
      <span className="text-caption font-semibold uppercase tracking-[0.08em] text-brand-coral">
        Research
      </span>
      <h1 className="text-heading-lg text-ink mt-3">
        Phishing Email Detection with Multimodal Deep Learning
      </h1>
      <p className="text-body-sm text-steel mt-4">
        Vishal Patil · Srihari Narayan · Akash Vora · Anila Sai Namburi
        <br />
        ENPM703 Fundamentals of AI and Deep Learning, Fall 2025
      </p>
      <div className="mt-6">
        <a
          href="/heron-research.pdf"
          target="_blank"
          rel="noopener noreferrer"
          download
          className={pillPrimary}
        >
          Download the paper (PDF)
        </a>
      </div>

      <section className="mt-12">
        <h2 className="text-heading-sm text-ink">Abstract</h2>
        <p className="text-body-md text-charcoal mt-3 text-justify">
          Phishing attacks exploit deceptive email content and fraudulent brand
          logos to compromise user security. This project develops a multimodal
          machine-learning system that detects phishing emails by jointly
          analyzing textual content and visual logo elements. We implement and
          compare six models - K-Nearest Neighbors, Logistic Regression, custom
          convolutional networks for text and image analysis, and a pretrained
          ResNet18 for logo classification - alongside a novel dual-tower fusion
          architecture that integrates all modalities. Using a combined dataset
          of 76,346 emails and the OpenLogo dataset of 72,652 brand logos across
          352 classes, our models reach validation accuracies from 76.30% to
          98.96%, and the dual-tower fusion model - which integrates text
          features (256-d), image features (512-d), and metadata (64-d) -
          achieves the highest accuracy at 99.45%.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-heading-sm text-ink">Key contributions</h2>
        <ol className="mt-4 space-y-4">
          {contributions.map((c, i) => (
            <li key={c.title} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-hairline text-body-sm font-semibold text-ink">
                {i + 1}
              </span>
              <div>
                <h3 className="text-body-md font-semibold text-ink">
                  {c.title}
                </h3>
                <p className="text-body-sm text-charcoal mt-1 text-justify">
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-heading-sm text-ink">Method</h2>
        <p className="text-body-md text-charcoal mt-3 text-justify">
          The <span className="text-ink font-medium">text tower</span> is a
          custom 1-D CNN: an embedding layer feeds four convolutional blocks
          (64→128→256→512) with batch-norm, ReLU and max-pooling, projected to a
          256-dimensional feature vector that captures urgency language and
          phishing patterns. The{" "}
          <span className="text-ink font-medium">image tower</span> is a
          VGG-style 2-D CNN over 224×224 logo crops, producing a 512-dimensional
          visual vector that detects brand marks and logo–domain mismatches. A
          small MLP projects 20 engineered metadata signals into 64 dimensions.
        </p>
        <p className="text-body-md text-charcoal mt-3 text-justify">
          The <span className="text-ink font-medium">fusion classifier</span>{" "}
          concatenates the three vectors into an 832-dimensional representation
          and passes it through four fully-connected layers (832→512→256→128→2).
          Training is two-stage: each tower is pretrained alone, frozen while
          the fusion head learns on stable features, then unfrozen for
          end-to-end fine-tuning at a reduced 1e-4 learning rate - cutting
          training time and avoiding catastrophic forgetting.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-heading-sm text-ink">Results</h2>
        <p className="text-body-md text-charcoal mt-3 text-justify">
          Deep learning substantially outperformed traditional baselines: the
          text CNN reached 98.96% against KNN&apos;s 81.71%, and transfer
          learning proved critical for vision, with ResNet18 at 97.43% versus
          the custom image CNN&apos;s 76.30%. Multimodal fusion delivered the
          strongest result - 99.45% accuracy with a ROC-AUC of 0.9998 and PR-AUC
          of 0.9999 - by capturing complementary signals that single-modality
          approaches miss. On roughly 10,000 validation emails the fusion model
          produced just 23 false positives and 32 false negatives.
        </p>
        <p className="text-body-sm text-steel mt-3">
          See the full model comparison on the{" "}
          <Link href="/benchmarks" className="text-ink underline">
            benchmarks page
          </Link>
          .
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-heading-sm text-ink">Data</h2>
        <p className="text-body-md text-charcoal mt-3 text-justify">
          The email corpus combines four public sources - CEAS_08, Enron,
          Nazario, and Nigerian Fraud - into 76,346 deduplicated, labelled
          emails (≈48% phishing, 52% legitimate). The logo corpus is the
          OpenLogo dataset: 72,652 images across 352 brand classes. To handle
          the scarcity of real phishing HTML, the test set was augmented with
          generative-AI-produced phishing emails that preserve authentic
          structure and embedded logos.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-heading-sm text-ink">References</h2>
        <ol className="mt-4 space-y-2 list-decimal pl-5">
          {references.map((r) => (
            <li key={r} className="text-body-sm text-steel">
              {r}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
