"use client";

import { useEffect, useState } from "react";
import type { AgentStep, AuditCost, Violation } from "@botswan/shared";
import { AgentTimeline } from "@/components/AgentTimeline";
import { ChartCompare } from "@/components/ChartCompare";
import { CostTicker } from "@/components/CostTicker";
import { ReportCard } from "@/components/ReportCard";

interface AuditViewProps {
  slug: string;
  initial?: {
    grade?: string;
    trustScore?: number;
    violations?: Violation[];
    agentSteps?: AgentStep[];
    cost?: AuditCost;
    status?: string;
    artifacts?: {
      originalChartUrl?: string;
      honestChartUrl?: string;
      auditPdfUrl?: string;
      notebookUrl?: string;
    };
  };
}

const DEFAULT_COST: AuditCost = {
  inputTokens: 0,
  outputTokens: 0,
  reasoningTokens: 0,
  usd: 0,
};

export function AuditView({ slug, initial }: AuditViewProps) {
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>(
    initial?.agentSteps ?? [],
  );
  const [cost, setCost] = useState<AuditCost>(initial?.cost ?? DEFAULT_COST);
  const [grade, setGrade] = useState(initial?.grade);
  const [trustScore, setTrustScore] = useState(initial?.trustScore);
  const [violations, setViolations] = useState<Violation[]>(
    initial?.violations ?? [],
  );
  const [status, setStatus] = useState(initial?.status ?? "running");
  const [artifacts, setArtifacts] = useState(initial?.artifacts);

  useEffect(() => {
    if (initial?.status === "complete") return;

    const source = new EventSource(`/api/audit/${slug}/stream`);

    source.onmessage = (event) => {
      const data = JSON.parse(event.data as string) as {
        agentSteps: AgentStep[];
        cost: AuditCost;
        status: string;
        grade?: string;
        trustScore?: number;
        violations: Violation[];
        done: boolean;
      };

      setAgentSteps(data.agentSteps);
      setCost(data.cost);
      setStatus(data.status);
      if (data.grade) setGrade(data.grade);
      if (data.trustScore !== undefined) setTrustScore(data.trustScore);
      if (data.violations.length) setViolations(data.violations);
      if (data.done) source.close();
    };

    source.onerror = () => {
      source.close();
    };

    return () => source.close();
  }, [slug, initial?.status]);

  const isComplete = status === "complete";

  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
      <header className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500">
          Audit / {slug}
        </p>
        <h1 className="mt-2 font-display text-3xl text-white">
          {isComplete ? "Audit complete" : "Audit in progress"}
        </h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {isComplete && grade ? (
            <ReportCard
              grade={grade}
              trustScore={trustScore}
              violations={violations}
              slug={slug}
            />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-ink-900/50 p-6">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-500">
                Agent pipeline
              </h2>
              <AgentTimeline steps={agentSteps} />
            </div>
          )}

          {isComplete && (
            <>
              <section>
                <h2 className="mb-4 font-display text-xl text-white">
                  Chart comparison
                </h2>
                <ChartCompare
                  originalUrl={artifacts?.originalChartUrl}
                  honestUrl={artifacts?.honestChartUrl}
                />
              </section>

              <section className="grid gap-3 sm:grid-cols-2">
                <DeliverableLink
                  label="Full audit report"
                  href={artifacts?.auditPdfUrl}
                />
                <DeliverableLink
                  label="Reproducible notebook"
                  href={artifacts?.notebookUrl}
                />
              </section>
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <CostTicker cost={cost} />
          {isComplete && (
            <p className="mt-4 text-center text-xs text-slate-500">
              This audit cost {cost.usd < 0.01 ? `$${cost.usd.toFixed(4)}` : `$${cost.usd.toFixed(2)}`} with GLM-5.3 Flash
            </p>
          )}
        </aside>
      </div>

      <CostTicker cost={cost} className="fixed bottom-4 right-4 lg:hidden" />
    </div>
  );
}

function DeliverableLink({
  label,
  href,
}: {
  label: string;
  href?: string;
}) {
  return (
    <a
      href={href ?? "#"}
      className={`block rounded-xl border border-white/10 bg-ink-900/50 px-4 py-3 text-sm ${
        href ? "hover:border-accent/30 text-white" : "text-slate-600 pointer-events-none"
      }`}
    >
      {label}
      {!href && (
        <span className="ml-2 text-xs text-slate-600">(pending)</span>
      )}
    </a>
  );
}
