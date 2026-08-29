"use client";

import { useState } from "react";

interface ChartCompareProps {
  originalUrl?: string;
  honestUrl?: string;
  originalLabel?: string;
  honestLabel?: string;
}

export function ChartCompare({
  originalUrl,
  honestUrl,
  originalLabel = "Original",
  honestLabel = "Honest re-chart",
}: ChartCompareProps) {
  const [slider, setSlider] = useState(50);

  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-ink-800">
        {originalUrl || honestUrl ? (
          <>
            <div
              className="absolute inset-0 flex items-center justify-center bg-ink-800 text-slate-600"
              style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}
            >
              {originalUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={originalUrl}
                  alt={originalLabel}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Placeholder label={originalLabel} />
              )}
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center bg-ink-900 text-slate-600"
              style={{ clipPath: `inset(0 0 0 ${slider}%)` }}
            >
              {honestUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={honestUrl}
                  alt={honestLabel}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Placeholder label={honestLabel} variant="honest" />
              )}
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={slider}
              onChange={(e) => setSlider(Number(e.target.value))}
              className="absolute inset-x-4 bottom-4 z-10 accent-accent"
              aria-label="Compare original and honest chart"
            />
          </>
        ) : (
          <div className="flex h-full items-stretch">
            <Placeholder label={originalLabel} className="flex-1 border-r border-white/10" />
            <Placeholder label={honestLabel} variant="honest" className="flex-1" />
          </div>
        )}
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{originalLabel}</span>
        <span>{honestLabel}</span>
      </div>
    </div>
  );
}

function Placeholder({
  label,
  variant = "original",
  className = "",
}: {
  label: string;
  variant?: "original" | "honest";
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 p-6 ${className}`}
    >
      <div
        className={`h-24 w-full max-w-[200px] rounded-lg ${
          variant === "honest"
            ? "bg-gradient-to-t from-accent/20 to-transparent"
            : "bg-gradient-to-t from-grade-f/20 to-transparent"
        }`}
      />
      <span className="text-xs uppercase tracking-wider text-slate-600">{label}</span>
    </div>
  );
}
