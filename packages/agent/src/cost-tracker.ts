import type { AuditCost, TokenUsage } from "@botswan/shared";

export class CostTracker {
  private totals: AuditCost = {
    inputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    usd: 0,
  };

  addUsage(usage: TokenUsage & { usd?: number }): void {
    this.totals.inputTokens += usage.inputTokens;
    this.totals.outputTokens += usage.outputTokens;
    this.totals.reasoningTokens = (this.totals.reasoningTokens ?? 0) + (usage.reasoningTokens ?? 0);
    this.totals.usd += usage.usd ?? 0;
  }

  getTotals(): AuditCost {
    return { ...this.totals };
  }

  reset(): void {
    this.totals = {
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      usd: 0,
    };
  }
}
