"use client";

import type { Violation } from "@botswan/shared";

interface ReportCardProps {
  grade: string;
  trustScore?: number;
  violations: Violation[];
  slug: string;
}

const GRADE_COLORS: Record<string, string> = {
  A: "text-grade-a",
  B: "text-grade-b",
  C: "text-grade-c",
  D: "text-grade-d",
  F: "text-grade-f",
};

const SEVERITY_STYLES: Record<Violation["severity"], string> = {
  critical: "border-grade-f/40 bg-grade-f/10 text-grade-f",
  major: "border-grade-d/40 bg-grade-d/10 text-grade-d",
  minor: "border-grade-c/40 bg-grade-c/10 text-grade-c",
};

export function ReportCard({
  grade,
  trustScore,
  violations,
  slug,
}: ReportCardProps) {
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/audit/${slug}`
      : `/audit/${slug}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
  };

  const gradeColor = GRADE_COLORS[grade] ?? "text-white";

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-ink-900 to-ink-950">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">
            BotSwan Report Card
          </p>
          <p
            className={`font-display text-7xl leading-none ${gradeColor}`}
            aria-label={`Grade ${grade}`}
          >
            {grade}
          </p>
          {trustScore !== undefined && (
            <p className="mt-2 text-sm text-slate-400">
              Trust score <span className="font-mono text-white">{trustScore}</span>/100
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:border-accent/40 hover:text-accent"
        >
          Copy share link
        </button>
      </div>

      <ul className="divide-y divide-white/5 p-4">
        {violations.length === 0 ? (
          <li className="py-3 text-sm text-slate-500">No violations flagged.</li>
        ) : (
          violations.map((v) => (
            <li key={v.code} className="flex items-start gap-3 py-3">
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${SEVERITY_STYLES[v.severity]}`}
              >
                {v.severity}
              </span>
              <div>
                <p className="text-sm font-medium text-white">{v.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{v.explanation}</p>
              </div>
            </li>
          ))
        )}
      </ul>
    </article>
  );
}
