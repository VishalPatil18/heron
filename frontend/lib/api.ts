// Typed client for the Heron backend. Prod URL is injected via NEXT_PUBLIC_API_URL
// (the live Cloud Run service: https://heron-api-787333291568.us-central1.run.app);
// dev falls back to a local backend on :8000.

export type Verdict = "phishing" | "legitimate";
export type Severity = "high" | "medium" | "low";

export interface Signal {
  code: string;
  label: string;
  severity: Severity;
}

export interface PredictResponse {
  verdict: Verdict;
  confidence: number;
  signals: Signal[];
  meta: { images_found: number; body_chars: number };
}

export type PredictInput = File | { text: string; subject?: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function predict(
  input: PredictInput,
  signal?: AbortSignal,
): Promise<PredictResponse> {
  let response: Response;
  if (input instanceof File) {
    const form = new FormData();
    form.append("file", input);
    response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      body: form,
      signal,
    });
  } else {
    response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Predict failed (${response.status}): ${detail}`);
  }
  return response.json() as Promise<PredictResponse>;
}
