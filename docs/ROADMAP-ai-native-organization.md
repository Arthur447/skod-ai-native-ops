# Roadmap — Skod as an AI-Native Organization

This document is the **living roadmap** of Skod as an AI-native engineering
organization. It tracks what is in place, what remains, and what is
deliberately out of scope.

The ambition is explicit: Skod must be, at full build-out, a **credible
reference point** for what a small team (operated as ~10 engineers) can
do with autonomous supervised agents. Not a demo, not a toy — a real SaaS
business with its operating model visible in public Git history.

References we benchmark against: Anthropic (Claude Code, skills, MCP),
Cognition (Devin multi-agent orchestration), Sierra (product agents with
HITL), Cursor (agent-first IDE), Replit (eval harness).

## Current state — honest inventory

| Capability | Status | Artefact |
|------------|:------:|----------|
| Operating model manifesto | ✅ | [`docs/HOW-WE-OPERATE.md`](HOW-WE-OPERATE.md) |
| System architecture diagram | ✅ (v1, needs split) | [`docs/architecture/ai-native-operations.md`](architecture/ai-native-operations.md) |
| ADR series | 🟡 (1 of ~6) | [`docs/adr/0001-lp-optimizer-architecture.md`](adr/0001-lp-optimizer-architecture.md) |
| Gherkin backlog with risk tiers | ✅ (one chantier) | [`docs/backlog/lp-optimizer-chantier.md`](backlog/lp-optimizer-chantier.md) |
| Enforcement tooling (dep-cruiser, jscpd) | 🟡 (configured, not in CI) | [`rnd/ai-native-tooling/`](../rnd/ai-native-tooling/) |
| MCP server for dev velocity | 🟡 (local only) | [`rnd/ai-native-tooling/mcp-servers/skod-consultations/`](../rnd/ai-native-tooling/mcp-servers/skod-consultations/) |
| Agent infrastructure (Python service) | ✅ (PR #913) | `services/skod-agent-service/` |
| Provider abstraction | ✅ | `web/modules/custom/commu_ia_agents/` (`AiProviderBridge`, `EmbeddingBridge`) |
| LP Optimizer with HITL | ✅ (PR #913) | `services/skod-agent-service/app/lp_optimizer/` |
| Consultation ReAct agent | ✅ (PR #913) | `services/skod-agent-service/app/agent.py` |
| Eval harness | ❌ | — |
| Prompt library (versioned, reviewable) | ❌ | — (prompts scattered in code) |
| Agent KPI tracking (actual measurements) | ❌ | — (listed in HOW-WE-OPERATE, not instrumented) |
| Audit trail (agent actions) | ❌ | — |
| Public-facing landing / narrative | ❌ | — (no README racine AI-native) |
| Review orchestrator agent (implemented) | ❌ | — (concept in diagram) |
| Planner agent (implemented) | ❌ | — (concept in diagram) |

## Priority Next-8 (ordered)

The next eight deliverables, ordered by expected impact × foundation
dependency. Upstream items unlock downstream ones.

### P1 — Wire enforcement tools into CI

**Why:** the manifesto says *"guidelines live in the CI, not in a wiki"*.
Today, dep-cruiser and jscpd are configured but the CI doesn't run them.
As long as that's true, the line is a claim, not a fact. Closing this gap
moves the whole operating model from credible to proven.

**Artefact target:** `.github/workflows/` (or equivalent) running both
linters on every PR, blocking on threshold violations.

**Status:** not started.

### P2 — Split + polish the architecture diagrams

**Why:** the current single Mermaid is too dense for the 10-second read
test. An external reader (potential employer, partner, future co-founder)
bounces off. Split into two focused diagrams — *engineering workflow* and
*product agents* — each one telling a single story.

**Artefact target:** `docs/architecture/engineering-workflow.md`,
`docs/architecture/product-agents.md`. Each with <15 nodes, <20 edges.

**Status:** not started.

### P3 — Execute first ticket exemplarily (SKD-1003)

**Why:** every artefact so far describes the process. We need one ticket
executed with full discipline to serve as the reference pattern for all
future tickets. SKD-1003 (Diagnostic with LLM enrichment) is the right
choice: it exercises the rules/LLM boundary, mid-risk, touches prompts.

**Artefact target:** code merged in PR #913's scope, plus an execution
log (plan → validated → coded → reviewed → merged) captured as a commit
trailer or short doc.

**Status:** in progress (this session).

### P4 — ADR 0002 — Eval harness for AI outputs

**Why:** without evals, the quality of agent outputs is measured by gut
feel. Every leading AI-native org has an eval infrastructure — it's what
turns *"our agent works"* into *"our agent works better than last month
on these 120 cases"*. Starting with LP Optimizer variants.

**Artefact target:** `docs/adr/0002-eval-harness.md` + a minimal
`services/skod-agent-service/app/evals/` skeleton with one eval suite
running.

**Status:** not started (follow-up noted in ADR 0001).

### P5 — Prompt-as-code layout and review process

**Why:** today, prompts live inside their calling modules
(`lp_optimizer/prompts.py`). They are the single most leveraged artefact
in an AI-native org — every agent-produced line of code derives from
them. They deserve their own folder, their own review convention, and
their own versioning discipline. See ADR 0003 (to write).

**Artefact target:** `services/skod-agent-service/prompts/` with
`<bounded-context>/<tool>.md` layout, a review convention in
`docs/CONTRIBUTING-prompts.md`, and `docs/adr/0003-prompt-as-code.md`.

**Status:** not started.

### P6 — Agent KPI instrumentation

**Why:** `HOW-WE-OPERATE.md` lists KPIs (rework rate, code survival, cost
per ticket, HITL latency, hallucination rate). Today these are aspirations.
Instrument them — even roughly, with a SQLite table written to per ticket
— so future claims on those metrics are grounded in data.

**Artefact target:** a small `agent_metrics` module in
`services/skod-agent-service/` + a JSONL or SQLite log fed by the agents
and the CI pipeline, plus a weekly roll-up.

**Status:** not started.

### P7 — Public README / landing for the operating model

**Why:** today, the manifesto is buried in `docs/`. For an external
reader landing on the repo, the first impression is a Drupal marketplace,
not an AI-native operating model. A clear root-level or `README-OPERATIONS.md`
section surfaces the work as the primary story.

**Artefact target:** a root `README-AI-OPERATIONS.md` (linked from the
main README) that reads like a landing page for the engineering model,
with clear links to HOW-WE-OPERATE, architecture, ADRs, backlog.

**Status:** not started.

### P8 — ADR 0004 — Review orchestrator implementation

**Why:** the review orchestrator agent is drawn in the diagram as a node
that spawns sub-agents (security, performance, quality). It does not
exist yet. Making it real — even as a minimal Python function that calls
three prompt-based reviewers and aggregates — moves the review step from
concept to operational.

**Artefact target:** `docs/adr/0004-review-orchestrator.md` + a minimal
`services/skod-agent-service/app/review/` implementation.

**Status:** not started.

---

## Part 2 — Beyond Engineering (360° AI-native organization)

The priorities above cover the **engineering** side of an AI-native
organization. The real differentiation — the positioning as a leader
of market, not just an AI-savvy VP Eng — comes from extending the
same operating model to **every business function**: product,
marketing, sales, customer success, operations, strategic
intelligence.

See [`docs/adr/0006-360-ai-native-organization-principles.md`](adr/0006-360-ai-native-organization-principles.md)
for the governing principles.

The first non-engineering chantier is **LPM (Landing Page Manager) +
Marketing Iteration Coach**, chosen because Skod's current business
bottleneck is PMF validation with zero conversion on 300 ad-sourced
visits. Accelerating the learning loop on landing-page iteration is
the highest-ROI business move we can make right now — and it is also
a pattern Arthur operated at scale at Cellfish, so we re-apply a
proven approach with a modern agent layer. Formalized in
[`docs/adr/0007-landing-page-manager-architecture.md`](adr/0007-landing-page-manager-architecture.md).

### P9 — Agent catalog structure

**Why:** every agent (engineering or non-engineering) needs a
versioned, reviewable definition (identity, tools, evals). Without
a catalog, we re-invent the wheel each time we add an agent, and
there is no single place where a reviewer can understand what agents
Skod runs.

**Artefact target:** top-level `agents/` folder with one subfolder
per agent: `identity.md` (system prompt), `tools.yaml` (MCP/functions
allowlist), `evals/` (test cases), `README.md` (invocation + role).

**Status:** not started. Will be set up concurrently with P10 so the
first 360° agent ships with the pattern in place.

### P10 — LPM + Marketing Iteration Coach (first non-engineering chantier)

**Why:** Skod's current conversion rate from Meta Ads is 0 on 300
visits — the core business gap. Arthur's existing workflow (ChatGPT
co-thinking → brief → Claude Code edit → deploy → relance ads) works
but loses all cross-iteration learning. The **LPM pattern** (landing
pages versioned as first-class entities with metadata, performance
tracked per version) is something Arthur successfully operated at
Cellfish; the novelty is adding an agent layer that leverages the
versioned history to propose the next hypothesis.

**Artefact target:**
- `web/v2/pages/lp-v{N}.html` — versioned LP files (lp-v1 is the
  current live page, relocated)
- `web/v2/lp_config.json` — active version pointer (already exists
  in PR #913, extended for multi-version routing)
- `/lp/v{N}` routes on the web server
- SQLite schema `lp_versions` + `lp_performance` (migration via
  Alembic)
- `agents/marketing-iteration-coach/` — agent catalog entry (identity,
  tools, evals)
- Meta Marketing API client reading performance per campaign /
  version
- Integration seam with PR #913's LP Optimizer so both auto-generated
  and human-driven variants land in the same data layer

**Estimated effort:** ~2,5 days focused work (schema + routing +
agent + first real iteration + tuning).

**Status:** blocked on SKD-1003 merge (one-chantier-at-a-time
discipline). To start right after.

### P11 — Content & SEO agent (deferred pending P10 results)

**Why:** if Meta Ads is not the right growth channel for Skod (which
the P10 learnings should reveal in 4-6 weeks), SEO becomes a higher
priority. A content agent synthesizes keyword research, produces
briefs for blog articles, and proposes content calendars.

**Trigger for activation:** learnings from P10 explicitly point to
SEO as the better acquisition channel, OR after 6 weeks of P10 with
some traction to build on.

**Status:** deferred.

### P12 — User research synthesis agent (deferred)

**Why:** once Skod has real users (post-PMF), an agent that
synthesizes feedback, NPS, consultation patterns, and support
tickets into actionable product direction. Currently premature — no
user volume.

**Trigger for activation:** ≥ 20 active consultants OR ≥ 50
completed consultations.

**Status:** deferred.

### P13 — Weekly executive briefing agent (deferred)

**Why:** once multiple 360° agents are running, a meta-agent that
synthesizes them into a Monday-9am briefing (business KPIs, technical
health, competitive movements, marketing iterations done, roadmap
progress). Premature while only one 360° agent exists.

**Trigger for activation:** ≥ 3 non-engineering agents in production.

**Status:** deferred.

### P14 — Competitive intelligence agent (deferred)

**Why:** monitor Malt, Collective, LinkedIn Services, and other
marketplace competitors for pricing, features, positioning changes.
Weekly report. Moderate business value — useful but not core to PMF.

**Trigger for activation:** post-PMF, when competitive moves affect
product decisions.

**Status:** deferred.

---

## Deliberately deferred (not in scope)

These are recognized gaps, deferred by design:

- **HITL abstraction layer** — today, LP Optimizer hand-rolls its Slack
  approval flow. Generalizing this into a shared HITL library is
  tempting, but YAGNI until we have a second use case.
- **Audit trail centralization** — every agent run logs to its own
  stdout/file. A centralized audit store (e.g. a shared Postgres table)
  is valuable but not the next-most-important thing. Will surface
  naturally during P6 (KPI instrumentation).
- **MCP server deployment** — the local MCP server is enough for one
  developer. A deployed MCP with OAuth is for when the team grows past 1.
- **Public writing (blog post, talk)** — the work must stand on its own
  first. Writing about it before P1–P8 are done would be premature.

## Working cadence

One chantier (group of tickets) at a time, no parallel initiatives. Each
chantier produces:

1. An ADR recording the decisions.
2. A Gherkin-decomposed backlog with risk tiers and budgets.
3. Executed tickets with visible AI-native workflow (plan validation,
   agent-produced code, review pipeline, HITL where applicable).
4. Updated KPIs (once P6 lands).

## Progress log

- **2026-04-17** — roadmap authored. Current state inventoried. P3
  (SKD-1003) started.
- **2026-04-17** — Part 2 added (P9–P14). Strategic shift: Skod is
  positioned as a 360° AI-native organization reference, not only an
  engineering AI playground. P10 (LPM + Marketing Iteration Coach)
  chosen as first non-engineering chantier, ROI-aligned with PMF
  bottleneck (0/300 conversion). Built on Arthur's Cellfish
  experience of LPM at scale. ADRs 0006 (360° principles) and 0007
  (LPM architecture) to follow.

## See also

- [`docs/HOW-WE-OPERATE.md`](HOW-WE-OPERATE.md) — operating model
- [`docs/architecture/ai-native-operations.md`](architecture/ai-native-operations.md) — system architecture
- [`docs/adr/`](adr/) — Architecture Decision Records
- [`docs/backlog/lp-optimizer-chantier.md`](backlog/lp-optimizer-chantier.md) — first chantier
- [`rnd/ai-native-tooling/NOTES.md`](../rnd/ai-native-tooling/NOTES.md) — R&D notes
