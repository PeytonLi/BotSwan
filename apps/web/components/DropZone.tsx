"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type UploadState = "idle" | "uploading" | "error";

export function DropZone() {
  const router = useRouter();
  const zoneRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const submitFormData = useCallback(
    async (formData: FormData) => {
      setState("uploading");
      setError(null);

      try {
        const response = await fetch("/api/audit", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Failed to start audit");
        }

        const data = (await response.json()) as { slug: string };
        router.push(`/audit/${data.slug}`);
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setState("idle");
      }
    },
    [router],
  );

  const startFileAudit = useCallback(
    async (file: File) => {
      const formData = new FormData();
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      formData.set("inputType", isPdf ? "pdf" : "upload");
      formData.set("image", file);
      if (csvFile) {
        formData.set("csv", csvFile);
      }
      await submitFormData(formData);
    },
    [csvFile, submitFormData],
  );

  const startPasteAudit = useCallback(
    async (dataUrl: string) => {
      const formData = new FormData();
      formData.set("inputType", "paste");
      formData.set("imageDataUrl", dataUrl);
      if (csvFile) {
        formData.set("csv", csvFile);
      }
      await submitFormData(formData);
    },
    [csvFile, submitFormData],
  );

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;

    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) {
            void readFileAsDataUrl(file).then((dataUrl) => startPasteAudit(dataUrl));
          }
          return;
        }
      }
    };

    zone.addEventListener("paste", onPaste);
    return () => zone.removeEventListener("paste", onPaste);
  }, [startPasteAudit]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragOver(false);
      const file = event.dataTransfer.files[0];
      if (file) void startFileAudit(file);
    },
    [startFileAudit],
  );

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void startFileAudit(file);
  };

  const onCsvChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCsvFile(event.target.files?.[0] ?? null);
  };

  const onUrlSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const url = new FormData(form).get("url")?.toString().trim();
    if (!url) return;

    const formData = new FormData();
    formData.set("inputType", "url");
    formData.set("url", url);
    if (csvFile) {
      formData.set("csv", csvFile);
    }
    void submitFormData(formData);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div
        ref={zoneRef}
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative rounded-2xl border-2 border-dashed p-10 text-center transition outline-none focus:border-accent/40 ${
          dragOver
            ? "border-accent bg-accent/5"
            : "border-white/15 bg-ink-900/40 hover:border-white/25"
        }`}
      >
        <input
          id="chart-upload"
          type="file"
          accept="image/*,.pdf,application/pdf"
          className="sr-only"
          onChange={onFileChange}
          disabled={state === "uploading"}
        />
        <label htmlFor="chart-upload" className="cursor-pointer">
          <p className="font-display text-xl text-white">
            {state === "uploading" ? "Starting audit…" : "Drop your chart here"}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            PNG, JPG, WebP, PDF · paste from clipboard · optional CSV ground truth
          </p>
          <span className="mt-6 inline-block rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
            Browse files
          </span>
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-ink-900 px-4 py-2.5 text-sm text-slate-400 hover:border-white/20">
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={onCsvChange}
            disabled={state === "uploading"}
          />
          {csvFile ? `CSV: ${csvFile.name}` : "Attach optional CSV ground truth"}
        </label>
      </div>

      <form onSubmit={onUrlSubmit} className="mt-4 flex gap-2">
        <input
          name="url"
          type="url"
          placeholder="Or paste chart URL…"
          className="flex-1 rounded-lg border border-white/10 bg-ink-900 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-accent/50 focus:outline-none"
          disabled={state === "uploading"}
        />
        <button
          type="submit"
          disabled={state === "uploading"}
          className="rounded-lg bg-swan-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-swan-600 disabled:opacity-50"
        >
          Audit URL
        </button>
      </form>

      {error && (
        <p className="mt-3 text-center text-sm text-grade-f" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
