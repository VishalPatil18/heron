// Single source of truth for the benchmarks page. Numbers are transcribed from
// README.md ("Results") / docs/Project_Report.pdf - keep them in sync.

export interface ModelRow {
  model: string;
  accuracy: number;
  note: string;
  highlight?: boolean;
}

export const models: ModelRow[] = [
  { model: "KNN (text features)", accuracy: 81.71, note: "Baseline" },
  { model: "Logistic Regression", accuracy: 80.0, note: "Baseline" },
  {
    model: "Custom Text CNN",
    accuracy: 98.96,
    note: "Phase 1 · text specialist",
  },
  {
    model: "Custom Image CNN",
    accuracy: 76.3,
    note: "Phase 1 · image specialist",
  },
  {
    model: "ResNet18 (transfer learning)",
    accuracy: 97.43,
    note: "Comparison baseline",
  },
  {
    model: "Dual-Tower Fusion",
    accuracy: 99.45,
    note: "Final model",
    highlight: true,
  },
];

export interface Metric {
  label: string;
  value: number; // 0–100, drives the bar width
  display: string; // exactly as reported
}

export const fusionMetrics: Metric[] = [
  { label: "Accuracy", value: 99.45, display: "99.45%" },
  { label: "AUC-ROC", value: 99.9, display: "0.999" },
  { label: "Precision (phishing)", value: 99.5, display: "99.5%" },
  { label: "Recall (phishing)", value: 99.4, display: "99.4%" },
  { label: "F1-Score", value: 99.4, display: "99.4%" },
];
