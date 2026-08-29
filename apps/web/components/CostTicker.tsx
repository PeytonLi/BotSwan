import type { AuditCost } from "@botswan/shared";

interface CostTickerProps {
  cost: AuditCost;
  className?: string;
}

function formatUsd(usd: number): string {
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

export function CostTicker({ cost, className = "" }: CostTickerProps) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-ink-900/90 px-4 py-3 shadow-lg backdrop-blur ${className}`}
      aria-live="polite"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        Audit cost
      </p>
      <p className="mt-1 font-mono text-2xl text-accent tabular-nums">
        {formatUsd(cost.usd)}
      </p>
      <dl className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-500">
        <div>
          <dt className="uppercase tracking-wide">In</dt>
          <dd className="font-mono text-slate-300">{cost.inputTokens.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Out</dt>
          <dd className="font-mono text-slate-300">{cost.outputTokens.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Reason</dt>
          <dd className="font-mono text-slate-300">
            {(cost.reasoningTokens ?? 0).toLocaleString()}
          </dd>
        </div>
      </dl>
    </div>
  );
}
