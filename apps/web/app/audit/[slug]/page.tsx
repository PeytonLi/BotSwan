import { AuditView } from "@/components/AuditView";
import { getConvexClient, api } from "@/lib/convex-client";
import { getInMemoryAudit } from "@/lib/audit-service";
import { buildArtifactUrls } from "@/lib/audit-runner";
import { computeGrade } from "@botswan/artifacts";
import { FROZEN_AUDIT_SLUGS, getFrozenAudit } from "@/lib/frozen-audits";

interface AuditPageProps {
  params: Promise<{ slug: string }>;
}

function frozenAuditInitial(slug: string) {
  const audit = getFrozenAudit(slug);
  if (!audit) {
    throw new Error(`Unknown frozen audit: ${slug}`);
  }

  const { trustScore } = computeGrade(audit.violations);

  return {
    grade: audit.grade,
    trustScore,
    violations: audit.violations,
    status: "complete" as const,
    artifacts: buildArtifactUrls(slug, process.env.NEXT_PUBLIC_SITE_URL),
    agentSteps: [
      {
        step: "INTAKE",
        status: "done" as const,
        summary: "Frozen example audit — instant load",
        timestamp: Date.now() - 60000,
      },
      {
        step: "PACKAGE",
        status: "done" as const,
        summary: "Pre-loaded deliverables ready",
        timestamp: Date.now(),
      },
    ],
    cost: {
      inputTokens: 12400,
      outputTokens: 3200,
      reasoningTokens: 1800,
      usd: 0.041,
    },
  };
}

export default async function AuditPage({ params }: AuditPageProps) {
  const { slug } = await params;

  if (FROZEN_AUDIT_SLUGS.has(slug)) {
    return <AuditView slug={slug} initial={frozenAuditInitial(slug)} />;
  }

  const memory = getInMemoryAudit(slug);
  if (memory) {
    return (
      <AuditView
        slug={slug}
        initial={{
          grade: memory.grade,
          trustScore: memory.trustScore,
          violations: memory.violations,
          agentSteps: memory.agentSteps,
          cost: memory.cost,
          status: memory.status,
          artifacts:
            memory.artifacts ??
            buildArtifactUrls(slug, process.env.NEXT_PUBLIC_SITE_URL),
        }}
      />
    );
  }

  const convex = getConvexClient();
  if (convex) {
    const audit = await convex.query(api.audits.getBySlug, { slug });
    if (audit) {
      return (
        <AuditView
          slug={slug}
          initial={{
            grade: audit.grade,
            trustScore: audit.trustScore,
            violations: audit.violations,
            agentSteps: audit.agentSteps,
            cost: audit.cost,
            status: audit.status,
            artifacts: audit.artifacts,
          }}
        />
      );
    }
  }

  return (
    <AuditView
      slug={slug}
      initial={{
        status: "running",
        agentSteps: [],
        cost: { inputTokens: 0, outputTokens: 0, usd: 0 },
        violations: [],
      }}
    />
  );
}
