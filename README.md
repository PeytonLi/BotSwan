# BotSwan

**The swan that audits your graphs.** BotSwan is a statistical chart auditor powered by GLM-5.3 Flash (via OpenRouter). Drop a chart image, paste from clipboard, link a URL, or upload a PDF — BotSwan extracts claims, runs Python statistical checks in a sandbox, and ships a shareable audit package with a report card, markdown report, reproducible notebook, and honest re-chart.

## Monorepo layout

| Path | Purpose |
|------|---------|
| `apps/web` | Next.js 15 web app (UI, API routes, Convex) |
| `packages/agent` | LLM pipeline: EXTRACT → PLAN → COMPUTE → VERIFY → RENDER → PACKAGE |
| `packages/artifacts` | Report card, audit markdown, notebook, honest chart spec |
| `packages/shared` | Shared TypeScript types and constants |
| `services/stats` | Python FastAPI stats microservice (sandbox, render, PDF, URL screenshot) |
| `examples/` | Frozen demo audits and SVG chart assets |

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **Python** 3.11+ (for stats service)
- **OpenRouter API key** (optional — omit for mock pipeline)
- **Convex account** (optional — omit for in-memory audits)

## Quick start

```bash
# Install dependencies
pnpm install

# Copy env templates
cp apps/web/.env.example apps/web/.env.local

# Terminal 1 — stats service
cd services/stats
python -m venv .venv
.venv/Scripts/activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Convex (optional)
cd apps/web
npx convex dev

# Terminal 3 — web app
pnpm --filter @botswan/web dev
```

Open [http://localhost:3000](http://localhost:3000). Click any **Example audit** card for an instant frozen demo, or upload a chart to start a live audit.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | No | OpenRouter key for live LLM pipeline. Omit for mock mode. |
| `STATS_API_URL` | For live compute/render/URL/PDF | Stats service base URL (default `http://localhost:8000`) |
| `NEXT_PUBLIC_CONVEX_URL` | No | Convex deployment URL from `npx convex dev` |
| `NEXT_PUBLIC_SITE_URL` | No | Public site URL for artifact links (default `http://localhost:3000`) |
| `SESSION_COOKIE_NAME` | No | Session cookie name (default `botswan_session`) |

## Running tests

```bash
# All unit/integration tests
pnpm test

# Individual workspaces
pnpm test:shared
pnpm test:web
pnpm test:artifacts
pnpm --filter @botswan/agent test

# Python stats tests
cd services/stats && pytest

# E2E smoke (Playwright — starts dev server automatically)
pnpm test:e2e
```

## Deploy notes

### Web (Vercel)

1. Connect the repo; set root directory to `apps/web`.
2. Build command: `pnpm build` (from repo root) or use the filter in Vercel monorepo settings.
3. Set env vars: `OPENROUTER_API_KEY`, `STATS_API_URL`, `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_SITE_URL`.

### Stats service (Railway / Fly / any container)

1. Deploy `services/stats` with `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
2. Point `STATS_API_URL` on the web app to the deployed URL.
3. Optional: install `botswan-stats[browser]` + Playwright for live URL screenshots.

### Convex

Run `npx convex deploy` from `apps/web` for production persistence.

## Hackathon submission checklist

- [x] Live demo URL loads homepage with 7 example audits (run `pnpm --filter @botswan/web dev`)
- [x] Click example → `/audit/[slug]` shows grade, violations, chart comparison
- [x] Upload flow starts audit and streams agent timeline (mock mode without API key)
- [x] Report card is screenshot-ready (grade + top violations)
- [x] Artifacts served at `/api/artifacts/[slug]/report-card.svg`, `audit.md`, `audit.ipynb`, `honest-chart.png`
- [x] Agent trace shows EXTRACT → PLAN → COMPUTE → VERIFY → RENDER → PACKAGE
- [x] Cost ticker updates with token usage
- [x] README + MIT LICENSE in repo root
- [ ] Deploy to Vercel + Railway (requires your env vars)
- [ ] Wire `OPENROUTER_API_KEY` for live GLM-5.3 Flash pipeline
- [ ] Run `npx convex dev` + deploy for persistent history
- [ ] Record 3-min demo video + post X thread

## License

MIT — see [LICENSE](./LICENSE).
