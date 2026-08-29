import Link from "next/link";
import type { AuditCost } from "@botswan/shared";
import { getConvexClient, api } from "@/lib/convex-client";
import { listInMemoryAuditsBySession } from "@/lib/audit-service";
import { getOrCreateSessionId } from "@/lib/session";

interface HistoryAudit {
  _id: string;
  slug: string;
  status: string;
  grade?: string;
  createdAt: number;
  cost: AuditCost;
}

export default async function HistoryPage() {
  const sessionId = await getOrCreateSessionId();
  const convex = getConvexClient();

  const audits: HistoryAudit[] = convex
    ? await convex.query(api.audits.listBySession, { sessionId })
    : listInMemoryAuditsBySession(sessionId).map((audit) => ({
        _id: audit.slug,
        slug: audit.slug,
        status: audit.status,
        grade: audit.grade,
        createdAt: audit.agentSteps[0]?.timestamp ?? Date.now(),
        cost: audit.cost,
      }));

  const totalCost = audits.reduce((sum: number, a) => sum + (a.cost?.usd ?? 0), 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="mb-10">
        <h1 className="font-display text-3xl text-white">Your audits</h1>
        <p className="mt-2 text-slate-400">
          Session-scoped history ·{" "}
          <span className="font-mono text-xs text-slate-600">{sessionId.slice(0, 8)}…</span>
        </p>
        {audits.length > 0 && (
          <p className="mt-4 text-sm text-accent">
            Session total: ${totalCost.toFixed(4)}
          </p>
        )}
      </header>

      {audits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-slate-500">No audits yet in this session.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-accent hover:underline"
          >
            Audit your first chart →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-ink-900/40">
          {audits.map((audit) => (
            <li key={audit._id}>
              <Link
                href={`/audit/${audit.slug}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/5 transition"
              >
                <div>
                  <p className="font-mono text-sm text-white">{audit.slug}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(audit.createdAt).toLocaleString()} · {audit.status}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-right">
                  {audit.grade && (
                    <span className="font-display text-2xl text-accent">
                      {audit.grade}
                    </span>
                  )}
                  <span className="font-mono text-xs text-slate-500">
                    ${audit.cost.usd.toFixed(4)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
