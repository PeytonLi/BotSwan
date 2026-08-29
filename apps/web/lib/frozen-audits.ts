import type { Violation } from "@botswan/shared";
import frozenAuditsJson from "../../../examples/frozen-audits.json";

export interface FrozenAudit {
  slug: string;
  title: string;
  grade: string;
  description: string;
  chartFile: string;
  violations: Violation[];
}

export const FROZEN_AUDITS = frozenAuditsJson.audits as FrozenAudit[];

export const FROZEN_AUDIT_SLUGS = new Set(FROZEN_AUDITS.map((audit) => audit.slug));

export function getFrozenAudit(slug: string): FrozenAudit | undefined {
  return FROZEN_AUDITS.find((audit) => audit.slug === slug);
}
