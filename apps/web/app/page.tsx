import Link from "next/link";
import { DropZone } from "@/components/DropZone";
import { FROZEN_AUDITS } from "@/lib/frozen-audits";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6">
      <section className="mb-16 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-accent/80">
          GLM-5.3 Flash · Statistical audit
        </p>
        <h1 className="font-display text-balance text-4xl font-normal leading-tight text-white sm:text-5xl md:text-6xl">
          The swan that audits your graphs
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 text-balance">
          Drop a chart image, paste from clipboard, or link a URL. BotSwan extracts
          claims, runs Python statistical checks, and ships a shareable audit package.
        </p>
      </section>

      <section className="mb-20">
        <DropZone />
      </section>

      <section>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl text-white">Example audits</h2>
            <p className="mt-1 text-sm text-slate-500">
              Pre-loaded frozen audits — instant load, screenshot-ready
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FROZEN_AUDITS.map((example) => (
            <Link
              key={example.slug}
              href={`/audit/${example.slug}`}
              className="group rounded-xl border border-white/10 bg-ink-900/60 p-5 transition hover:border-accent/30 hover:shadow-glow"
              data-testid={`example-${example.slug}`}
            >
              <div className="mb-4 flex aspect-video items-center justify-center rounded-lg bg-ink-800/80">
                <span className="font-display text-4xl text-slate-600 group-hover:text-accent/40 transition-colors">
                  {example.grade}
                </span>
              </div>
              <h3 className="font-medium text-white group-hover:text-accent transition-colors">
                {example.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{example.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
