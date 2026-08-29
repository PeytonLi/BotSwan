import type { Violation } from "@botswan/shared";
import { GRADE_THRESHOLDS } from "@botswan/shared";

const SEVERITY_PENALTY: Record<Violation["severity"], number> = {
  critical: 40,
  major: 15,
  minor: 5,
};

export interface GradeResult {
  grade: string;
  trustScore: number;
}

function scoreToGrade(trustScore: number): string {
  if (trustScore >= GRADE_THRESHOLDS.A) return "A";
  if (trustScore >= GRADE_THRESHOLDS.B) return "B";
  if (trustScore >= GRADE_THRESHOLDS.C) return "C";
  if (trustScore >= GRADE_THRESHOLDS.D) return "D";
  return "F";
}

export function computeGrade(violations: Violation[]): GradeResult {
  let trustScore = 100;

  for (const violation of violations) {
    trustScore -= SEVERITY_PENALTY[violation.severity];
  }

  trustScore = Math.max(0, Math.min(100, trustScore));

  if (violations.some((v) => v.severity === "critical")) {
    return { grade: "F", trustScore };
  }

  return { grade: scoreToGrade(trustScore), trustScore };
}
