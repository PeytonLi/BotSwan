# BotSwan — Product Requirements Document

**Version:** 1.0  
**Date:** August 28, 2026  
**Hackathon:** GLM-5.3 Flash Lightning Hackathon (Aug 28 – Sep 1, 2026)  
**Tracks:** Frontier Build + Most Viral (dual entry)  
**Model:** `z-ai/glm-5.3-flash` via OpenRouter  

---

## 1. Executive Summary

**BotSwan** is an AI statistical auditor for data visualizations. Users submit a chart — as an image, URL, PDF, clipboard paste, or with optional CSV ground truth — and BotSwan runs a multi-step agentic pipeline powered by GLM-5.3 Flash: extract claims, reverse-engineer data, execute statistical tests in Python, re-render an honest version of the chart, and deliver a shareable audit package.

The product thesis: **most statistical misinformation lives in charts, not spreadsheets.** BotSwan meets people where the lie is visible.

### Hackathon positioning

| Track | How BotSwan wins |
|-------|------------------|
| **Frontier Build** | Native multimodal vision → agent orchestration → sandboxed Python execution → visual self-verification loop. Only viable with a vision-native, agentic, cost-efficient model. |
| **Most Viral** | 30-second demo: upload viral chart → brutal report card → side-by-side honest re-chart. Shareable links, pre-loaded roasts, X-thread-ready output. |

### One-liner

> Upload any chart. BotSwan tells you if it's lying — and shows you what an honest version looks like.

### Tagline options

- *See through muddy data.*
- *Chart forensics, powered by GLM-5.3 Flash.*
- *The swan that audits your graphs.*

---

## 2. Goals & Non-Goals

### Goals

1. Ship a **public, working demo** at `botswan.app` (or equivalent) before Sep 1 submission deadline.
2. Demonstrate **GLM-5.3 Flash** for: chart vision, long-horizon agent planning, tool calling, and visual comparison of re-rendered output.
3. Produce **four output artifacts** per audit: report card, full audit doc, reproducible notebook, honest re-chart.
4. Support **all input modalities** in v1: upload, paste, URL, PDF, optional CSV.
5. Persist **audit history** with **shareable public links**.
6. Display **live token cost** per audit (Flash cost narrative).
7. Expose **visible agent steps** in the UI for demo video and Frontier credibility.
8. Submit: public GitHub repo, README, ~3 min demo video, X thread.

### Non-Goals (post-hackathon)

- User accounts / OAuth (anonymous session + link sharing is sufficient for v1)
- Real-time collaboration
- Batch audit of entire newspapers
- Legal certification or formal fact-check accreditation
- Mobile native apps

---

## 3. Users & Personas

Primary audience: **anyone** who encounters a chart and wants to know if they should trust it.

| Persona | Motivation | Typical input |
|---------|------------|---------------|
| **Curious scrollers** | "This viral chart feels wrong" | Screenshot upload |
| **Journalists / creators** | Need a quick sanity check before amplifying | URL or paste |
| **Students / educators** | Learn what makes charts misleading | Upload + read audit |
| **Analysts / PMs** | Validate a deck slide before a meeting | PDF or PNG + optional CSV |
| **Developers / judges** | Evaluate agent depth and model use | Pre-loaded examples + agent trace |

No persona is prioritized over another in UX copy or flows.

---

## 4. User Journeys

### Journey A — Quick roast (viral path)

**Actor:** Anonymous user on X who clicked a shared audit link.

1. Lands on shared audit page (`/audit/{id}`).
2. Sees original chart, report card (letter grade + top 3 violations), honest re-chart side-by-side.
3. Clicks **"Audit your own chart"**.
4. Drags a PNG onto the drop zone.
5. Watches agent steps stream live (Extract → Plan → Compute → Verify → Render).
6. Cost ticker increments in corner (`$0.003 and counting…`).
7. Audit completes in ~30–90s.
8. Clicks **Share** → copies link, posts to X with pre-filled text.
9. Optional: downloads PDF audit or `.ipynb` notebook.

**Success criteria:** Share link works without login; report card is readable in an X card preview.

---

### Journey B — Deep audit with ground truth

**Actor:** Analyst validating a slide.

1. Opens BotSwan home.
2. Uploads chart PNG **and** attaches CSV (`ground_truth.csv`).
3. Agent detects mismatch between visual and data (e.g., truncated axis, wrong aggregation).
4. Python backend runs: Shapiro-Wilk, appropriate test selection, effect sizes, confidence intervals.
5. User receives full markdown audit citing specific assumption violations.
6. Honest re-chart rendered from CSV (not estimated data).
7. Notebook contains every cell executed — fully reproducible.
8. Audit saved to session history (`/history`).

**Success criteria:** When CSV provided, re-chart uses actual data; audit cites numeric test outputs.

---

### Journey C — URL / webpage chart

**Actor:** User pastes a news article URL.

1. Pastes URL into input field.
2. Backend fetches page (or user-triggered screenshot via Playwright service).
3. GLM-5.3 Flash identifies chart regions in page screenshot.
4. User confirms which chart to audit (if multiple).
5. Standard audit pipeline proceeds.

**Success criteria:** At least one chart extracted from a static news page without manual crop.

---

### Journey D — PDF report page

**Actor:** User uploads earnings report PDF.

1. Uploads PDF (max 20 pages scanned for figures).
2. Agent extracts figure pages as images.
3. User selects figure(s) to audit.
4. Per-figure audit runs (parallel subagents where possible).
5. Combined PDF audit export available.

**Success criteria:** Multi-figure PDF yields individual audit IDs + optional bundle link.

---

### Journey E — Clipboard paste

**Actor:** User copied chart from Slack / Twitter / Excel.

1. Focuses drop zone, `Ctrl+V`.
2. Image captured from clipboard API.
3. Immediate audit start — zero friction path.

**Success criteria:** Paste works in Chrome/Firefox/Safari desktop.

---

### Journey F — Returning user (history)

**Actor:** Same browser, prior session cookie.

1. Opens `/history`.
2. Sees list of past audits: thumbnail, grade, date, cost, share link.
3. Clicks any item → full audit replay with frozen agent trace.

**Success criteria:** History persists 30 days without account; share links permanent.

---

## 5. Feature Requirements

### 5.1 Input modalities

| Input | Priority | Implementation notes |
|-------|----------|----------------------|
| Image upload (PNG, JPG, WebP, GIF) | P0 | Drag-drop + file picker; max 10 MB |
| Clipboard paste | P0 | `paste` event on drop zone |
| Chart URL | P0 | Fetch OG image or Playwright full-page screenshot |
| PDF upload | P0 | `pdf2image` or PyMuPDF → per-page images |
| Optional CSV ground truth | P0 | Parsed by pandas; overrides vision-estimated data |
| Optional text claim | P1 | "The headline says 500% growth" — cross-checked against chart |

### 5.2 Agent pipeline (core)

Multi-step orchestration with **visible steps** in UI:

```
INTAKE → EXTRACT → PLAN → COMPUTE → VERIFY → RENDER → PACKAGE
```

| Step | Agent action | Tools |
|------|--------------|-------|
| **INTAKE** | Classify input type, normalize to image(s) | file parser, URL fetcher, PDF extractor |
| **EXTRACT** | Vision: chart type, axes, labels, trends, implied claims | GLM-5.3 Flash multimodal |
| **PLAN** | Select statistical checks (see §5.3) | GLM-5.3 Flash reasoning |
| **COMPUTE** | Generate + execute Python | FastAPI sandbox, scipy, statsmodels, pandas |
| **VERIFY** | Compare re-rendered chart to original visually | GLM-5.3 Flash vision on both images |
| **RENDER** | Produce honest chart (matplotlib/plotly) | Python backend |
| **PACKAGE** | Assemble all four deliverables | template engine |

Each step emits SSE events → frontend timeline component.

**Subagent parallelism (solo dev strategy):**

- PDF page extraction: parallel per page
- Multi-chart URL pages: parallel per detected chart
- COMPUTE: separate codegen agent + execution agent
- VERIFY: independent visual diff agent

### 5.3 Statistical audit catalog

BotSwan checks for (non-exhaustive; agent selects relevant subset):

| Category | Checks |
|----------|--------|
| **Axis manipulation** | Truncated y-axis, dual axes, scale switching |
| **Cherry-picking** | Hidden time ranges, outlier removal, bin manipulation |
| **Wrong test** | t-test on non-normal small n, Pearson on non-linear, ignoring paired structure |
| **Aggregation traps** | Simpson's paradox, ecological fallacy, averaging rates wrong |
| **Base rate neglect** | Relative vs absolute risk, small denominator |
| **Causation from correlation** | r ≠ causation, missing confounders |
| **Visual deception** | 3D distortion, area vs length, pictograph scaling |
| **Missing context** | No error bars, no sample size, no CI, p-hacking signals |
| **Data estimation** | When no CSV: bootstrap from visual extraction with uncertainty bands |

Every flagged issue includes: **severity**, **plain-English explanation**, **what an honest version would show**, **Python code that ran**.

### 5.4 Output deliverables (all four required)

#### A. Report card (shareable image + web component)

- Letter grade (A–F) or trust score (0–100)
- Top violations as icons + one-liners
- OG-image rendered for X/Twitter cards
- Designed for screenshot virality

#### B. Full audit document (Markdown → PDF)

- Executive summary
- Chart description
- Claims extracted vs verified
- Statistical methods used
- Assumption checks with test statistics
- Recommendations
- Disclaimer footer

#### C. Reproducible notebook (`.ipynb`)

- Every Python cell from COMPUTE step
- Pinned dependency versions
- Runs top-to-bottom without manual edits

#### D. Honest re-chart (PNG + interactive if plotly)

- Side-by-side with original in UI
- Correct axis baseline, full time range, proper CI/error bars
- Source noted: "from CSV" vs "estimated from visual"

### 5.5 History & sharing

| Feature | Spec |
|---------|------|
| Session ID | Anonymous cookie / localStorage UUID |
| Audit record | `{ id, createdAt, inputType, thumbnail, grade, costUsd, shareSlug }` |
| Share URL | `/audit/{slug}` — public, no auth, permanent |
| History page | `/history` — session-scoped list |
| Storage | Convex (preferred) or Postgres on Railway |

### 5.6 Cost counter

- Real-time token count from OpenRouter response headers / usage object
- Display: input tokens, output tokens, reasoning tokens, **USD cost**
- Cumulative session total on history page
- Hackathon hook: *"This full audit cost $0.04 with GLM-5.3 Flash"*

### 5.7 Pre-loaded examples (viral seed content)

Ship 5+ curated audits accessible from homepage carousel:

1. Truncated y-axis "hockey stick" growth
2. Cherry-picked time window hiding crash
3. Simpson's paradox demographic breakdown
4. Misleading pie chart (too many slices, no part-to-whole)
5. Correlation headline with tiny n
6. Dual-axis deception
7. Pictograph area scaling error

Each is a **frozen audit** (instant load) + link to "audit similar."

---

## 6. Technical Architecture

### 6.1 Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind, shadcn/ui |
| Package manager | **pnpm** |
| API / agent orchestration | Next.js API routes OR dedicated `orchestrator` service |
| Statistical engine | **Python FastAPI** on Railway |
| LLM | **OpenRouter** → `z-ai/glm-5.3-flash` |
| Database / realtime | **Convex** (audits, history, share links, agent step streaming) |
| File storage | Convex file storage or Railway S3-compatible bucket |
| Frontend hosting | **Vercel** |
| Python hosting | **Railway** |
| URL screenshots | Playwright worker (Railway sidecar or Browserless) |
| Charts | matplotlib + plotly (Python), recharts (frontend preview) |

### 6.2 System diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel — Next.js (botswan.app)                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │ Upload   │  │ Agent    │  │ Report   │  │ Share /     │ │
│  │ UI       │  │ Timeline │  │ Card     │  │ History     │ │
│  └────┬─────┘  └────▲─────┘  └──────────┘  └──────┬──────┘ │
│       │             │ SSE                           │       │
│       ▼             │                               ▼       │
│  ┌─────────────────────────────────┐    ┌─────────────────┐ │
│  │ Agent Orchestrator (TS)         │    │ Convex          │ │
│  │ • step state machine            │◄──►│ • audits        │ │
│  │ • OpenRouter client             │    │ • shares        │ │
│  │ • tool dispatch                 │    │ • agent logs    │ │
│  └──────────┬──────────────────────┘    │ • file blobs    │ │
└─────────────┼───────────────────────────┴─────────────────┘ │
              │ HTTP + SSE                                      │
              ▼                                                 │
┌─────────────────────────────────────────────────────────────┐
│  Railway — Python FastAPI                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ /execute     │  │ /render      │  │ /extract-pdf     │  │
│  │ sandboxed    │  │ matplotlib   │  │ /screenshot-url  │  │
│  │ scipy code   │  │ plotly       │  │ playwright       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│  OpenRouter — z-ai/glm-5.3-flash                            │
│  • vision (chart extract)  • reasoning (plan)             │
│  • tool calls              • vision (verify re-chart)       │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 OpenRouter integration

```typescript
// Model config
const MODEL = "z-ai/glm-5.3-flash";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// Recommended params (from Z.ai docs)
const DEFAULT_PARAMS = {
  temperature: 1,
  top_p: 0.95,
  // reasoning_effort: "max" via OpenRouter provider-specific
};
```

**Multimodal message format:**

```json
{
  "role": "user",
  "content": [
    { "type": "text", "text": "Extract all statistical claims from this chart." },
    { "type": "image_url", "image_url": { "url": "data:image/png;base64,..." } }
  ]
}
```

**Tool calling:** OpenAI-compatible `tools` array for orchestrator functions:
- `run_python`
- `render_chart`
- `fetch_url_screenshot`
- `extract_pdf_figures`
- `save_audit_artifact`

### 6.4 Python sandbox security

Railway FastAPI `/execute` endpoint:

- Subprocess with timeout (30s default, 120s max)
- Restricted imports allowlist: `pandas`, `numpy`, `scipy`, `statsmodels`, `matplotlib`, `plotly`
- No network, no filesystem outside `/tmp/{job_id}/`
- Memory cap via container limits
- Code generated by LLM, logged verbatim in notebook output

### 6.5 Data model (Convex)

```typescript
// audits table
{
  _id: Id<"audits">,
  slug: string,              // URL-safe share ID
  sessionId: string,       // anonymous browser session
  status: "pending" | "running" | "complete" | "failed",
  input: {
    type: "upload" | "paste" | "url" | "pdf",
    originalUrl?: string,
    hasGroundTruthCsv: boolean,
  },
  grade: string,             // A-F
  trustScore: number,        // 0-100
  violations: Array<{
    code: string,
    severity: "critical" | "major" | "minor",
    title: string,
    explanation: string,
  }>,
  artifacts: {
    reportCardUrl: string,
    auditPdfUrl: string,
    notebookUrl: string,
    honestChartUrl: string,
    originalChartUrl: string,
  },
  agentSteps: Array<{
    step: string,
    status: "running" | "done" | "error",
    summary: string,
    timestamp: number,
    tokensUsed?: number,
  }>,
  cost: {
    inputTokens: number,
    outputTokens: number,
    reasoningTokens: number,
    usd: number,
  },
  createdAt: number,
}
```

---

## 7. UI/UX Requirements

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Hero, upload zone, example carousel, live demo CTA |
| `/audit/new` | Active audit with agent timeline + cost ticker |
| `/audit/[slug]` | Completed audit — all four deliverables |
| `/history` | Session audit list |

### Key components

- **DropZone** — upload + paste + URL input + PDF + CSV attachment
- **AgentTimeline** — vertical stepper with streaming status text
- **CostTicker** — fixed bottom-right, animates on token events
- **ReportCard** — grade badge, violation chips, share button
- **ChartCompare** — slider or side-by-side original vs honest
- **ShareModal** — copy link, X intent URL, download buttons

### Design direction

- Clean, editorial feel (trust + authority without being boring)
- Dark mode default (screenshots pop on X)
- Swans as subtle motif — not cartoonish
- Report card uses bold typography for grade — screenshot-optimized

---

## 8. Agent Step Visibility (Frontier demo requirement)

Each step streams to UI via Convex subscription or SSE:

```
✓ INTAKE     — Received PNG (2400×1600), no CSV attached
✓ EXTRACT    — Detected: line chart, 2019–2024, y-axis starts at 95 not 0
● PLAN       — Running 4 checks: axis truncation, trend test, CI presence…
○ COMPUTE    — waiting
○ VERIFY     — waiting
○ RENDER     — waiting
○ PACKAGE    — waiting

Cost so far: $0.0087
```

Failed steps show error + retry button (max 2 retries per step).

---

## 9. Four-Day Build Schedule

### Day 1 — Aug 28 (Foundation)

- [ ] pnpm monorepo: `apps/web`, `services/stats`, `packages/shared`
- [ ] Next.js shell on Vercel, FastAPI on Railway, Convex project
- [ ] OpenRouter client with vision + tool calling
- [ ] Basic upload → GLM extract → display raw JSON
- [ ] Agent step SSE plumbing

### Day 2 — Aug 29 (Pipeline core)

- [ ] Full EXTRACT → PLAN → COMPUTE loop
- [ ] Python `/execute` + `/render` endpoints
- [ ] Report card generation
- [ ] Honest re-chart rendering
- [ ] Cost counter wired to OpenRouter usage

### Day 3 — Aug 30 (Inputs + outputs)

- [ ] URL screenshot + PDF extraction
- [ ] Clipboard paste
- [ ] CSV ground truth path
- [ ] Full audit PDF + `.ipynb` export
- [ ] Convex persistence + share links + history

### Day 4 — Aug 31 (Polish + ship)

- [ ] 5–7 pre-loaded example audits
- [ ] OG images for share cards
- [ ] Visual verify step (GLM compares both charts)
- [ ] Bug bash, error states, loading skeletons
- [ ] 3-min demo video
- [ ] README + X thread draft
- [ ] Submit before Sep 1 midnight

### Buffer — Sep 1

- Fix judges' first-click experience
- Respond to X engagement

---

## 10. Hackathon Submission Checklist

| Asset | Status | Notes |
|-------|--------|-------|
| Public GitHub repo | ☐ | MIT license, clean README |
| README | ☐ | Architecture diagram, GLM-5.3 Flash usage, cost comparison |
| Live demo URL | ☐ | Vercel production deploy |
| 3-min demo video | ☐ | Upload chart → agent steps → report card → share |
| X thread | ☐ | Tag @zai_org, #GLM53Flash, 3 example roasts with links |
| GLM-5.3 Flash callout | ☐ | Explicit in README + UI footer: "Powered by GLM-5.3 Flash via OpenRouter" |

### X thread structure (draft)

1. Hook: "I built an AI that roasts misleading charts. Powered by GLM-5.3 Flash for $0.04/audit."
2. 15s screen recording — upload → grade F
3. Side-by-side honest re-chart
4. Agent trace screenshot (Frontier credibility)
5. Link to live demo + GitHub
6. Tag @zai_org

---

## 11. Success Metrics

### Hackathon

| Metric | Target |
|--------|--------|
| Live audits completed (launch day) | 50+ |
| X thread impressions | 10k+ |
| Share links created | 20+ |
| Demo video views | 500+ |

### Product quality

| Metric | Target |
|--------|--------|
| Audit completion rate | >80% |
| P50 audit latency | <90s |
| Avg cost per audit | <$0.10 |
| Pre-loaded examples load | <2s |

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Vision data extraction inaccurate | Wrong audit | CSV ground truth path; show uncertainty bands |
| Python sandbox escape | Security | Allowlist imports, timeout, isolated /tmp |
| OpenRouter latency | Slow audits | Stream steps; show progress; parallel subagents |
| URL fetch blocked by paywalls | Failed URL input | Graceful fallback: "paste screenshot instead" |
| 4-day scope creep | Nothing ships | Frozen audits for demo; ship core path first |
| Legal pushback on "roasting" real charts | Reputation | Disclaimer: automated analysis, not formal fact-check |

---

## 13. Environment Variables

```bash
# apps/web (.env.local)
OPENROUTER_API_KEY=
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_APP_URL=https://botswan.app
STATS_API_URL=https://stats.botswan.app  # Railway

# services/stats (.env)
OPENROUTER_API_KEY=          # if Python calls GLM directly for verify
CORS_ORIGINS=https://botswan.app
SANDBOX_TIMEOUT_SECONDS=30
```

---

## 14. Repository Structure (pnpm)

```
BotSwan/
├── apps/
│   └── web/                 # Next.js frontend + orchestrator
├── services/
│   └── stats/               # Python FastAPI
├── packages/
│   └── shared/              # Types, constants, prompt templates
├── docs/
│   └── PRD.md               # this file
├── examples/                # Pre-loaded chart assets + frozen audits
├── pnpm-workspace.yaml
└── README.md
```

---

## 15. Open Questions (resolved)

| Question | Decision |
|----------|----------|
| LLM provider | OpenRouter → `z-ai/glm-5.3-flash` |
| Package manager | pnpm |
| Stack | Next.js + Python FastAPI |
| Stats execution | Python backend (Railway) |
| Inputs | All (upload, paste, URL, PDF, CSV) |
| Outputs | All four deliverables |
| Tracks | Max depth both Frontier + Viral |
| Users | Anyone |
| Deploy | Vercel + Railway + Convex |
| History | Yes, with share links |
| Cost counter | Yes |
| Brand | BotSwan |
| Agent visibility | Yes |
| Budget | No cap |

---

## 16. Next Step

**Begin implementation:** scaffold monorepo, deploy Convex + Railway + Vercel skeleton, wire first OpenRouter vision call on chart upload.

---

*BotSwan PRD v1.0 — ready for build.*
