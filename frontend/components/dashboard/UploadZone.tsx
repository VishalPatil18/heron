"use client";

import { useRef, useState } from "react";
import type { PredictInput } from "@/lib/api";
import { Button } from "@/components/ui/Button";

const samples = {
  phishing: "/samples/phishing_example.html",
  legit: "/samples/legit_example.html",
} as const;

async function sampleFile(path: string): Promise<File> {
  const res = await fetch(path);
  const blob = await res.blob();
  return new File([blob], path.split("/").pop()!, { type: "text/html" });
}

export function UploadZone({
  onSubmit,
  disabled,
}: {
  onSubmit: (input: PredictInput) => void;
  disabled: boolean;
}) {
  const [tab, setTab] = useState<"upload" | "paste">("upload");
  const [dragging, setDragging] = useState(false);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const tabClass = (active: boolean) =>
    `px-4 py-2 text-body-sm font-medium border-b-2 -mb-px ${
      active
        ? "border-ink text-ink"
        : "border-transparent text-steel"
    }`;

  return (
    <div className="rounded-xl border border-hairline p-6">
      <div className="flex border-b border-hairline">
        <button
          type="button"
          className={tabClass(tab === "upload")}
          onClick={() => setTab("upload")}
        >
          Upload file
        </button>
        <button
          type="button"
          className={tabClass(tab === "paste")}
          onClick={() => setTab("paste")}
        >
          Paste text
        </button>
      </div>

      {tab === "upload" ? (
        <div className="mt-6">
          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            onClick={() => !disabled && fileRef.current?.click()}
            onKeyDown={(e) => {
              if (!disabled && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (disabled) return;
              const file = e.dataTransfer.files[0];
              if (file) onSubmit(file);
            }}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
              dragging ? "border-brand-coral bg-brand-coral/5" : "border-hairline"
            } ${disabled ? "opacity-50" : "cursor-pointer"}`}
          >
            <p className="text-body-md text-ink">Drop an email here</p>
            <p className="text-body-sm text-steel mt-1">
              or click to choose a .html or .eml file
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".html,.eml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSubmit(file);
              e.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional)"
            disabled={disabled}
            className="w-full rounded-md border border-hairline px-3 py-2 text-body-sm text-ink placeholder:text-stone focus:border-ink focus:outline-none disabled:opacity-50"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the email body here…"
            disabled={disabled}
            rows={6}
            className="w-full resize-y rounded-md border border-hairline px-3 py-2 text-body-sm text-ink placeholder:text-stone focus:border-ink focus:outline-none disabled:opacity-50"
          />
          <Button
            variant="primary"
            disabled={disabled || text.trim().length === 0}
            onClick={() => onSubmit({ text, subject })}
          >
            Scan text
          </Button>
        </div>
      )}

      <div className="mt-6 border-t border-hairline pt-4">
        <p className="text-caption text-steel">Or try a sample</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            variant="tertiary"
            disabled={disabled}
            onClick={async () => onSubmit(await sampleFile(samples.phishing))}
          >
            Phishing sample
          </Button>
          <Button
            variant="tertiary"
            disabled={disabled}
            onClick={async () => onSubmit(await sampleFile(samples.legit))}
          >
            Legitimate sample
          </Button>
        </div>
      </div>
    </div>
  );
}
