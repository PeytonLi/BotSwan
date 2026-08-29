# BotSwan — Multi-Agent Implementation Plan

**Goal:** Ship full PRD scope with 95% completion certainty by Sep 1, 2026.  
**Method:** TDD (vertical slices), frequent commits, parallel subagents.

---

## Agent Roles

| Agent | Responsibility | Owns |
|-------|----------------|------|
| **A0 — Scaffolding** | Monorepo, tooling, CI, env templates, deploy skeleton | `pnpm-workspace.yaml`, apps/services skeleton, test runners |
| **A1 — Stats Service** | Python FastAPI: execute, render, PDF, URL screenshot | `services/stats/` |
| **A2 — LLM & Orchestrator** | OpenRouter client, agent pipeline, tools, cost tracking | `packages/agent/`, orchestrator in web |
| **A3 — Data & Persistence** | Convex schema, mutations, queries, file storage | `apps/web/convex/` |
| **A4 — Web UI** | Pages, components, upload flows, agent timeline | `apps/web/app/`, `components/` |
| **A5 — Artifacts** | Report card, PDF, notebook, honest chart generation | `packages/artifacts/` |
| **A6 — Examples & Seed** | Pre-loaded audits, example chart assets | `examples/` |
| **A7 — Integration & QA** | E2E, contract tests, smoke scripts, README | `tests/`, `.github/` |

---

## Dependency Graph

```
A0 (scaffolding)
 ├── A1 (stats) ──────────────┐
 ├── A2 (orchestrator) ────────┼── A7 (integration)
 ├── A3 (convex) ─────────────┤
 ├── A4 (UI) ─────────────────┤
 └── A5 (artifacts) ──────────┘
         └── A6 (examples) ── A7
```

**Parallel waves after A0:**

- Wave 1: A1 + A2 + A3 (no UI dependency)
- Wave 2: A5 (needs A1 + A2 interfaces)
- Wave 3: A4 (needs A2 + A3 + A5)
- Wave 4: A6 + A7

---

## TDD Strategy

### Principles (from TDD skill)

- **Vertical slices only** — one behavior test → minimal impl → commit
- **Public interfaces** — test HTTP routes, exported functions, page behavior
- **No horizontal "all tests first"**

### Test layers

| Layer | Tool | Location |
|-------|------|----------|
| Stats unit/integration | pytest | `services/stats/tests/` |
| Agent/orchestrator | vitest | `packages/agent/tests/` |
| Artifacts | vitest | `packages/artifacts/tests/` |
| API routes | vitest + supertest pattern | `apps/web/tests/` |
| Convex | convex-test | `apps/web/convex/tests/` |
| E2E smoke | playwright | `tests/e2e/` |

### Commit cadence

- After every **RED→GREEN** cycle (or small batch of related greens)
- Format: `feat(scope): description` / `test(scope): description` / `fix(scope): description`

---

## Phase Breakdown

### Phase 0 — Scaffolding (A0) — ~2h

- [ ] `git init`, `.gitignore`, MIT LICENSE
- [ ] pnpm workspace: `apps/web`, `services/stats`, `packages/agent`, `packages/shared`, `packages/artifacts`
- [ ] Next.js 15 + Tailwind + shadcn init
- [ ] FastAPI + pytest + ruff
- [ ] Shared TypeScript types package
- [ ] `.env.example` files
- [ ] Root `README.md` stub
- [ ] `pnpm test` runs all workspaces

**Tracer bullet test:** `pnpm test` exits 0 with one passing smoke test per package.

---

### Phase 1 — Stats Service (A1) — ~4h

| # | Test (RED) | Implementation (GREEN) |
|---|------------|------------------------|
| 1.1 | `POST /health` returns 200 | FastAPI app skeleton |
| 1.2 | `POST /execute` runs `print(2+2)` → `"4"` | Subprocess sandbox |
| 1.3 | `POST /execute` blocks `import os` | Import allowlist |
| 1.4 | `POST /execute` times out long loop | Timeout handler |
| 1.5 | `POST /render` returns PNG bytes from matplotlib spec | Chart renderer |
| 1.6 | `POST /extract-pdf` returns page images | PyMuPDF/pdf2image |
| 1.7 | `POST /screenshot-url` returns PNG | Playwright (skip in CI if no browser) |

---

### Phase 2 — Agent & OpenRouter (A2) — ~5h

| # | Test (RED) | Implementation (GREEN) |
|---|------------|------------------------|
| 2.1 | OpenRouter client parses usage/cost | `createCompletion()` wrapper |
| 2.2 | Vision message builds image_url content | Multimodal message builder |
| 2.3 | EXTRACT step returns structured claims JSON | Prompt + parse |
| 2.4 | PLAN step returns check list | Prompt + parse |
| 2.5 | Pipeline runs EXTRACT→PLAN with mocked LLM | Step machine |
| 2.6 | COMPUTE calls stats `/execute` | Tool handler |
| 2.7 | VERIFY compares two images via vision | Dual-image prompt |
| 2.8 | Cost accumulator sums tokens across steps | `CostTracker` |

---

### Phase 3 — Convex (A3) — ~3h

| # | Test (RED) | Implementation (GREEN) |
|---|------------|------------------------|
| 3.1 | Schema validates audit shape | `convex/schema.ts` |
| 3.2 | `createAudit` mutation | Insert pending audit |
| 3.3 | `appendAgentStep` mutation | Step streaming |
| 3.4 | `completeAudit` with artifacts | Final state |
| 3.5 | `getAuditBySlug` query | Public share |
| 3.6 | `listAuditsBySession` query | History |
| 3.7 | File upload for chart blobs | `storage` API |

---

### Phase 4 — Artifacts (A5) — ~4h

| # | Test (RED) | Implementation (GREEN) |
|---|------------|------------------------|
| 4.1 | Report card HTML/PNG from violations | `@botswan/artifacts` |
| 4.2 | Markdown audit doc from pipeline result | Template |
| 4.3 | `.ipynb` JSON from executed cells | Notebook builder |
| 4.4 | Honest chart spec from audit + CSV | Plot spec generator |
| 4.5 | PDF export from markdown | puppeteer or pdf-lib |

---

### Phase 5 — Web UI (A4) — ~6h

| # | Test (RED) | Implementation (GREEN) |
|---|------------|------------------------|
| 5.1 | Home page renders drop zone | `/` |
| 5.2 | Upload triggers audit API | `POST /api/audit` |
| 5.3 | Agent timeline shows steps | `AgentTimeline` + SSE/subscription |
| 5.4 | Cost ticker updates | `CostTicker` |
| 5.5 | Audit page shows 4 deliverables | `/audit/[slug]` |
| 5.6 | Share button copies URL | ShareModal |
| 5.7 | History page lists session audits | `/history` |
| 5.8 | Paste, URL, PDF, CSV inputs | Extended DropZone |

---

### Phase 6 — Examples (A6) — ~2h

- [ ] 7 chart PNGs in `examples/charts/`
- [ ] Frozen audit JSON for instant load
- [ ] Homepage carousel wired to examples

---

### Phase 7 — Integration (A7) — ~4h

- [ ] Contract test: web → stats health
- [ ] Integration: mock LLM full pipeline → artifacts
- [ ] Playwright: upload example → see grade
- [ ] `scripts/smoke.sh` for CI
- [ ] Full README with architecture diagram
- [ ] Hackathon submission checklist in README

---

## File Ownership (avoid conflicts)

```
apps/web/                    → A4 (+ A2 orchestrator routes)
apps/web/convex/             → A3
services/stats/              → A1
packages/agent/              → A2
packages/artifacts/          → A5
packages/shared/             → A0 then shared
examples/                    → A6
tests/e2e/                   → A7
docs/                        → plan owner
```

---

## Environment Variables (user must provide)

| Variable | Required for | Notes |
|----------|--------------|-------|
| `OPENROUTER_API_KEY` | Real audits | Tests use mocks without it |
| `CONVEX_DEPLOYMENT` | Persistence | `npx convex dev` generates |
| `NEXT_PUBLIC_CONVEX_URL` | Frontend | From Convex dashboard |
| `STATS_API_URL` | Python calls | `http://localhost:8000` local |

Optional for deploy: Vercel token, Railway token (user deploys manually or via CLI).

---

## Risk Mitigations for 95% Certainty

| Risk | Mitigation |
|------|------------|
| OpenRouter key missing | `MOCK_LLM=true` mode ships full UI with canned responses |
| Playwright URL fetch fails CI | Feature flag; upload path is primary |
| Convex not configured | SQLite fallback via libsql for local dev |
| 4-day time | Parallel subagents; frozen examples guarantee demo |

---

## Definition of Done

- [ ] All Phase 0–7 checkboxes complete
- [ ] `pnpm test` green
- [ ] `pytest` green in stats service
- [ ] Playwright smoke green (or skipped with documented reason)
- [ ] README documents setup, env, deploy, hackathon submission
- [ ] 7 pre-loaded examples load on homepage
- [ ] Full audit path works with real OpenRouter key
- [ ] Share links + history persist via Convex
- [ ] 10+ commits with conventional messages

---

## Execution Order (this session)

1. A0 completes → commit `chore: scaffold monorepo`
2. Parallel: A1 + A2 + A3
3. A5 after A1+A2 interfaces stable
4. A4 wiring
5. A6 + A7
6. Final integration commit + goal complete
