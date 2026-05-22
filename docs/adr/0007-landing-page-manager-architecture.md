# ADR 0007 — Landing Page Manager (LPM) Architecture

- **Status**: Accepted
- **Date**: 2026-04-17
- **Decision maker**: VP Engineering (Arthur Collenot)
- **Bounded context**: `lpm` (new — marketing iteration layer)
- **Parent**: [ADR 0006 — 360° AI-native organization principles](0006-360-ai-native-organization-principles.md)
- **Related**: ADR 0001 (LP Optimizer pipeline) — the auto-generation
  path that will plug into the LPM data layer
- **Backlog**: roadmap [P10](../ROADMAP-ai-native-organization.md#p10--lpm--marketing-iteration-coach-first-non-engineering-chantier)

## Context

### Business state

Skod is in PMF validation. The public-safe business state is:

- paid acquisition is being tested as a learning channel;
- conversion evidence is not yet strong enough to claim PMF;
- landing page iteration must preserve hypotheses, versions, and
  attribution;
- one private LP Optimizer implementation already validates the
  auto-iteration pattern with Slack HITL.

### Current workflow (manual, today)

The current LP iteration loop is partly manual:

1. Read acquisition and behavior stats.
2. Ask an AI assistant to synthesize what to change and why.
3. Turn that into an implementation brief.
4. Generate or edit the next landing-page variant.
5. Deploy, relaunch acquisition, wait for enough signal, repeat.

This workflow *works*, but it has three fatal flaws:

1. **No cross-iteration memory.** Each assistant session can start
   fresh. By iteration 10, the system may have forgotten what was tried
   at iteration 3 unless history is structured.
2. **No traceability.** Index.html is mutated in place. The historical
   state of v3 is lost when v4 overwrites it. Git log shows diffs but
   not the *hypothesis* that motivated each change.
3. **No performance attribution per variant.** Meta Pixel records
   events on the URL that received the ad traffic. If that URL's
   content changes, the attribution becomes a moving target — *you
   cannot say "v3 converted better than v2"* cleanly.

### The LPM pattern

In prior growth work, Arthur operated a Landing Page Manager pattern: each
iteration produces a **new** landing page file with a unique URL. Ads
are pointed at specific versions. Performance is tracked per version.
Historical versions remain accessible.

This solves the three flaws above: memory (each version is a first-class
entity), traceability (versions are append-only, never overwritten),
and attribution (each version has its own URL, its own Pixel events,
its own cohort).

## Decision

Build the **LPM** as a new bounded context within Skod, with three
cooperating pieces:

1. **Data layer** — the authoritative registry of every LP version,
   its lineage, its metadata, its performance.
2. **Version generator** — two input paths (human-driven briefs via
   Marketing Iteration Coach plus an implementation assistant,
   auto-generated variants via the LP Optimizer). Both write to the same
   data layer.
3. **Marketing Iteration Coach agent** — the brain. Reads the data
   layer (version history + performance), proposes the next
   hypothesis to test, drafts the brief for the generator.

### Architecture overview

```
HUMAN-DRIVEN PATH (early PMF, now)        AUTO-PATH (post-PMF, later)
──────────────────────────────────         ──────────────────────────
Marketing Iteration Coach (agent)          LP Optimizer
  • reads LPM history                        • paid traffic trigger
  • analyzes patterns                        • GA4 behavioral metrics
  • proposes next hypothesis                 • diagnostic (SKD-1003)
  • drafts brief                             • variant generator
        │                                            │
        ▼                                            ▼
   Implementation assistant                    Slack HITL
   (edits new file)                                  │
        │                                            ▼
        ▼                                     lp_v{N}.html created
lp_v{N}.html created
        │                                            │
        └─────────────────┬──────────────────────────┘
                          ▼
        ┌─────────────────────────────────────────┐
        │         LPM — Data layer (SQLite)        │
        │                                          │
        │  lp_versions                             │
        │    (id, filename, parent_version_id,     │
        │     hypothesis, changes_summary,         │
        │     created_at, created_by, status)      │
        │                                          │
        │  lp_performance                          │
        │    (version_id, date, meta_campaign_id,  │
        │     visits, scroll_50, cta_clicks,       │
        │     email_submits, leads, ad_spend_eur)  │
        └─────────────────────────────────────────┘
                          │
                          ▼
                Acquisition campaigns
                (URL per variant → clean attribution)
```

### Data model

```sql
-- Registry of every LP version ever shipped.
CREATE TABLE lp_versions (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    filename          TEXT NOT NULL,              -- 'pages/lp-v3.html'
    parent_version_id INTEGER REFERENCES lp_versions(id),
    hypothesis        TEXT NOT NULL,              -- human-readable
    changes_summary   TEXT NOT NULL,              -- diff in natural language
    created_at        TIMESTAMP NOT NULL,
    created_by        TEXT NOT NULL,              -- 'human' | 'agent-iteration-coach' | 'agent-lp-optimizer'
    status            TEXT NOT NULL DEFAULT 'draft' -- 'draft' | 'active' | 'archived'
);

-- Per-day performance stats per version.
CREATE TABLE lp_performance (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    version_id       INTEGER NOT NULL REFERENCES lp_versions(id),
    date             DATE NOT NULL,
    meta_campaign_id TEXT,
    visits           INTEGER NOT NULL DEFAULT 0,
    scroll_50        INTEGER NOT NULL DEFAULT 0,
    cta_clicks       INTEGER NOT NULL DEFAULT 0,
    email_submits    INTEGER NOT NULL DEFAULT 0,
    leads            INTEGER NOT NULL DEFAULT 0,
    ad_spend_eur     REAL NOT NULL DEFAULT 0,
    UNIQUE(version_id, date, meta_campaign_id)
);
```

### File structure

```
landing-pages/
├── index.html              — kept for backward compatibility, redirects
│                             or proxies to the current default version
├── pages/
│   ├── lp-v1.html          — current live LP (relocated here)
│   ├── lp-v2.html          — first tested variant
│   ├── lp-v3.html          — …
│   └── ...
├── lp_config.json          — pointer to active version(s), split ratios
│                             (extension of the existing runtime config)
└── _shared/                — header, footer, CSS, JS snippets
```

### Routing

- `/` — redirects to the current default active version
- `/lp/v{N}` — explicit access to a specific version (Meta ad
  campaigns point here for clean attribution)
- Static serving, no server-side rendering needed

### Marketing Iteration Coach — agent catalog

The agent follows the roadmap P9 agent-catalog layout (not yet
formalized but this is the first concrete example):

```
agents/marketing-iteration-coach/
├── identity.md             — system prompt (role, scope, output format)
├── tools.yaml              — allowed tools (list_versions, get_performance,
│                             get_qualitative_insights, propose_hypothesis,
│                             draft_brief)
├── evals/                  — test cases (fake version history, assert
│                             coach proposes non-duplicate hypothesis)
└── README.md               — invocation instructions, role explanation
```

### Integration with LP Optimizer

The LP Optimizer already contains versioned landing-page conventions and
a runtime configuration pointer — the seeds of the LPM data layer. This
ADR formalizes and extends that work:

- LP Optimizer's variant files land in a versioned landing-page folder.
- LP Optimizer inserts a row in `lp_versions` when it generates a
  variant (`created_by = 'agent-lp-optimizer'`).
- LP Optimizer's existing Slack HITL flow becomes one of two paths into
  the data layer — the other being Marketing Iteration Coach plus an
  implementation assistant.

This is an additive integration through the new data layer, not a
replacement of the existing LP Optimizer pattern.

## Alternatives considered

### A. Continue mutating `index.html` in place

*Rejected.* This is the current workflow. It loses memory, loses
attribution, and scales poorly after several iterations.

### B. Git branches as the versioning mechanism

*Rejected.* Tempting — each variant = a branch, git log is the
history. But Meta Ads need a stable URL per variant; git branches
don't expose a URL. And performance tracking needs a query plane,
which git log does not provide.

### C. A separate git repo or submodule for LP iterations

*Rejected.* Premature modularization. The LP is one file, the
versioning is one SQLite database. A whole repo adds deploy
complexity (cross-repo dependency) for no benefit.

### D. Use a SaaS LP tool (Unbounce, Leadpages, ConvertKit)

*Rejected.* These tools exist and work, but they take Skod out of
the AI-native operating model — the agent cannot read/write their
internal state. The professional differentiation (*"I operate my
LPM with agents on my repo"*) disappears. Also: monthly fees, and
the narrative weakens from *"I built this"* to *"I bought this"*.

### E. Defer LPM until after SKD-1003 and subsequent engineering
tickets

*Rejected.* Engineering tickets are important but not revenue-path.
Skod's survival depends on PMF, which depends on finding a
converting LP. Investing in the engineering operating model while
the business bleeds is poor priority. P10 is correctly placed as
the next chantier after SKD-1003.

## Consequences

### Positive

- **Cross-iteration learning preserved.** Every hypothesis, every
  change, every outcome is in SQL. Patterns emerge over 10-20
  iterations that were impossible to see iteration-by-iteration.
- **Clean attribution.** Each version has its own URL and its own
  Pixel cohort. Conversion claims become rigorous.
- **Agent has real memory.** The Marketing Iteration Coach reads
  structured history, not only assistant conversation context.
- **Pattern generalizes.** The same data-layer + agent-reader
  pattern can apply to content calendar iterations, email
  sequences, ad creative iterations — each gets its own SQLite
  table and coach agent when their time comes (P11+).
- **Defensible narrative for interviews.** *"I operate an LPM on
  Skod — same pattern I shipped at Cellfish, rebuilt with an
  agent layer. 15 versions, structured hypotheses, measurable
  learning velocity."*

### Negative / Risks

- **Deployment complexity grows modestly.** Deploying 15 HTML
  files instead of 1 is trivial, but deploying the SQLite
  database reliably and keeping the Python agent in sync with the
  web server needs attention. Mitigation: single Docker
  deployment for the whole `skod-agent-service`, SQLite lives in
  a mounted volume.
- **File count grows.** After 20 iterations, the versioned landing-page folder
  contains 20 HTML files. Some will be archived (status =
  'archived'). Mitigation: a periodic cleanup command that moves
  archived files out of the hot path and into a cold directory.
- **Agent can propose bad hypotheses.** HITL on generation is not
  HITL on hypothesis quality. Mitigation: the first 2-3 weeks,
  a human reviews every proposed hypothesis before the generator
  runs. As the agent's eval score improves (P4 roadmap), gate
  can loosen.

## Implementation plan (P10 chantier)

Decomposition into SKD-prefixed tickets will follow the same
Gherkin + risk-tier + budget pattern as `docs/backlog/lp-optimizer-chantier.md`.
Draft ticket list:

- SKD-2001 — `lp_versions` + `lp_performance` schema + Alembic
  migration
- SKD-2002 — `/lp/v{N}` routing on the web server + `lp_config.json`
  extension
- SKD-2003 — Relocate current `index.html` to `pages/lp-v1.html`,
  seed the `lp_versions` registry with v1 metadata
- SKD-2004 — Meta Marketing API client for performance per version
- SKD-2005 — Agent catalog skeleton (`agents/marketing-iteration-coach/`)
- SKD-2006 — Agent tools (list_versions, get_performance,
  get_qualitative_insights, propose_hypothesis, draft_brief)
- SKD-2007 — Integration hook from LP Optimizer into
  `lp_versions`
- SKD-2008 — First real iteration, end-to-end, documented as execution
  log (same pattern as SKD-1003)

Total effort estimate: a few focused days. API cost is tracked as part
of normal delivery governance.

## Follow-ups

- First execution log — SKD-2001 through SKD-2008 with phased commits
  (planner / human validation / coder / reviewer / human review).
- Update `HOW-WE-OPERATE.md` to add a "Non-engineering agents"
  section pointing to this ADR as the first concrete example.
- After 4-6 weeks of production use, retrospective ADR update: what
  patterns emerged, what to tune, what new agent (P11+) is naturally
  suggested by the data.

## References

- [ADR 0001 — LP Optimizer pipeline architecture](0001-lp-optimizer-architecture.md)
- [ADR 0006 — 360° AI-native organization principles](0006-360-ai-native-organization-principles.md)
- [`docs/ROADMAP-ai-native-organization.md` — P10](../ROADMAP-ai-native-organization.md#p10--lpm--marketing-iteration-coach-first-non-engineering-chantier)
- [`docs/HOW-WE-OPERATE.md`](../HOW-WE-OPERATE.md) — engineering-side
  operating model (parent document)
- Prior growth-platform experience — summarized publicly without
  exposing private client material.
