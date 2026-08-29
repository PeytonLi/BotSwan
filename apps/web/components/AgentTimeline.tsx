import type { AgentStep } from "@botswan/shared";
import { PIPELINE_STEPS } from "@botswan/shared";

interface AgentTimelineProps {
  steps: AgentStep[];
  className?: string;
}

function statusIcon(status: AgentStep["status"] | "pending") {
  switch (status) {
    case "done":
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-grade-a/20 text-grade-a text-xs">
          ✓
        </span>
      );
    case "running":
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-accent text-xs animate-pulse">
          ●
        </span>
      );
    case "error":
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-grade-f/20 text-grade-f text-xs">
          ✕
        </span>
      );
    default:
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-slate-600 text-xs">
          ○
        </span>
      );
  }
}

export function AgentTimeline({ steps, className = "" }: AgentTimelineProps) {
  const stepMap = new Map(steps.map((s) => [s.step, s]));

  return (
    <ol className={`space-y-0 ${className}`}>
      {PIPELINE_STEPS.map((name, index) => {
        const step = stepMap.get(name);
        const status = step?.status ?? "pending";

        return (
          <li key={name} className="relative flex gap-4 pb-6 last:pb-0">
            {index < PIPELINE_STEPS.length - 1 && (
              <span
                className="absolute left-3 top-7 h-[calc(100%-1.25rem)] w-px bg-white/10"
                aria-hidden
              />
            )}
            {statusIcon(status)}
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="font-mono text-xs uppercase tracking-wider text-slate-500">
                {name}
              </p>
              <p
                className={`mt-0.5 text-sm ${
                  status === "error"
                    ? "text-grade-f"
                    : status === "running"
                      ? "text-accent"
                      : "text-slate-300"
                }`}
              >
                {step?.summary ??
                  (status === "pending" ? "waiting" : "—")}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
