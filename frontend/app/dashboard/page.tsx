"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HeronLogo } from "@/components/HeronLogo";
import { Button } from "@/components/ui/Button";
import { predict, type PredictInput, type PredictResponse } from "@/lib/api";
import { UploadZone } from "@/components/dashboard/UploadZone";
import { ScanProgress } from "@/components/dashboard/ScanProgress";
import { ResultCard } from "@/components/dashboard/ResultCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

type Status = "idle" | "scanning" | "done" | "error";

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return "Couldn't reach the scanner. Check your connection and try again.";
  }
  if (/\(400\)/.test(msg)) {
    return "That email couldn't be read. Try a .html/.eml file or paste the text.";
  }
  return "Something went wrong while scanning. Please try again.";
}

export default function DashboardPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const lastInput = useRef<PredictInput | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function runScan(input: PredictInput) {
    if (status === "scanning") return; // guard double-submit
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastInput.current = input;
    setStatus("scanning");
    setResult(null);
    setError("");
    try {
      const res = await predict(input, controller.signal);
      if (controller.signal.aborted) return;
      setResult(res);
      setStatus("done");
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(friendlyError(err));
      setStatus("error");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-hairline-soft">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center px-6">
          <Link href="/" className="text-ink">
            <HeronLogo />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-12">
        <h1 className="text-heading-md text-ink">Scan an email</h1>
        <p className="text-body-md text-steel mt-2 max-w-xl">
          Drop in an email and Heron returns a verdict with the signals that
          gave it away.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <UploadZone onSubmit={runScan} disabled={status === "scanning"} />

          <div>
            {status === "idle" && <EmptyState />}
            {status === "scanning" && <ScanProgress />}
            {status === "done" && result && (
              <ResultCard result={result} onReset={() => setStatus("idle")} />
            )}
            {status === "error" && (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-hairline p-8 text-center">
                <p className="text-body-md text-ink">{error}</p>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    onClick={() =>
                      lastInput.current && runScan(lastInput.current)
                    }
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-hairline-soft">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-6">
          <p className="text-body-sm text-steel">Nothing swims past.</p>
          <Link href="/team" className="text-body-sm text-ink">
            Hire the team →
          </Link>
        </div>
      </footer>
    </div>
  );
}
