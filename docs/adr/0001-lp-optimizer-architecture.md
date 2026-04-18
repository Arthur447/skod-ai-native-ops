# ADR 0001 — LP Optimizer pipeline architecture

- **Status**: Accepted
- **Date**: 2026-04-17
- **Decision maker**: VP Engineering (Arthur Collenot)
- **Bounded context**: `lp_optimizer` (Python microservice)
- **Related**: PR #913

## Context

Skod is in **PMF validation** stage. The primary growth lever is paid
acquisition via Meta Ads driving traffic to a landing page. At ~€20 spent
per landing variant, the statistical signal on conversion is robust enough
to diagnose underperformance and iterate.

Three constraints frame this chantier:

1. **Single-operator reality** — one human currently runs product + ops +
   engineering. Any manual step that costs more than 2 minutes / week is a
   blocker.
2. **PMF not scale** — we optimize for learning velocity, not throughput.
   SQLite is fine, one run per day is fine, Celery is overkill.
3. **Irreversible public surface** — a bad landing variant burns ad budget
   and hurts conversion. Auto-deploy is forbidden. A human must approve
   every activation.

The question: **how do we use AI agents to compress the "observe → diagnose
→ generate variant → validate → deploy" loop from 1 week of manual work to
1 hour of concentrated attention?**

## Decision

Build an **agent pipeline with Human-in-the-Loop on activation**, split
into five deterministic stages, each owned by a single Python module.

```
Meta Ads spend trigger (>= €20)
    ↓
meta_insights.py       →  collect ads performance
ga4 (via collector)    →  collect behavioral metrics
diagnostic.py          →  deterministic rules + LLM enrichment
generator.py           →  Claude generates single-section HTML variant
database.py            →  persist run with HMAC callback URLs
notifier.py            →  Slack message with approve / reject / preview
    ↓
HUMAN VALIDATION (Slack action)
    ↓
deployer.py            →  atomic tempfile-then-rename swap of LP config
```

Key design choices:

1. **Synchronous webhook router** (`router.py`). No Celery, no queue. One
   run per day means no concurrency problem to solve. Adding a queue now
   would be YAGNI.

2. **SQLite with HMAC-signed callback URLs**. Persistence is file-local,
   no separate DB server. HMAC-SHA256 on callback URLs prevents tampering
   by anyone without the `CALLBACK_SECRET`.

3. **Never auto-deploy**. `deployer.py` is invoked **only** from the Slack
   callback path, never from the generator. This is architectural, not a
   configuration flag — impossible to accidentally enable.

4. **Single section replacement**. The generator replaces one landing
   section at a time, not the whole page. Smaller diff to review, easier
   rollback, lower hallucination surface.

5. **Provider abstraction** via the `AiProviderBridge` service in
   `commu_ia_agents`. The LP Optimizer doesn't import Anthropic directly;
   it goes through the bridge, so we can swap providers without rewriting
   the pipeline.

## Alternatives considered

### A. Full autonomous pipeline (no HITL)

*Rejected.* Conversion rate is the business-critical KPI. A bad variant
going live costs ad spend and signal quality on the funnel. The cost of a
human one-click on Slack is ~30 seconds. The expected value of removing
that gate is strictly negative.

### B. Fully manual pipeline (agents advise, human executes every step)

*Rejected.* This is today's workflow. It costs ~4 hours per iteration and
has dominated my week since launch. The point of the chantier is to
compress it.

### C. Queue + worker architecture (Celery + Redis)

*Rejected for now.* One LP run per day. Adding a queue introduces: another
service to run, another failure mode, more configuration, more tests.
Revisit when we hit **> 3 runs/day** or when we add a second pipeline
sharing the infra.

### D. Persist to the existing MariaDB

*Rejected.* Would create a cross-service dependency between the Python
microservice and the Drupal MariaDB. SQLite makes the microservice
self-contained and deployable independently. If we later need cross-
service querying, we expose via a thin Drupal REST endpoint, not shared
DB access.

## Consequences

### Positive

- **Learning velocity** — the cycle "ads run → variant tested" drops from
  ~1 week to ~2 hours wall-clock (the rest is Meta ads delivery time).
- **Safety** — no irreversible action without human approval. Budget
  exposure is capped at one variant's ad spend.
- **Portability** — SQLite + self-contained microservice means the LP
  Optimizer can run on any VPS or serverless environment independently of
  the Drupal stack.
- **Agent clarity** — five named stages, each with a single responsibility
  and testable in isolation. New bounded-context tech leads (hypothetical
  future team) can own stages independently.

### Negative / Risks

- **Single-instance** — SQLite + synchronous webhook means no horizontal
  scaling. Acceptable at PMF stage, revisit if we hit throughput limits.
- **No eval infrastructure yet** — hallucination rate on generated
  variants is not systematically measured. We rely on human review to
  catch issues, not on agent-level quality metrics. *Follow-up ADR needed.*
- **Diagnostic rules are hand-written** — they reflect current hypotheses
  about what makes a landing page convert, not learned patterns. Need to
  be revisited as we accumulate variant performance data.

## Follow-ups

- ADR 0002 (proposed) — **Eval harness for generated LP variants**:
  capture variant → conversion outcome pairs, build a retrospective dataset,
  train a classifier to predict variant quality before human review.
- Monitoring — expose the KPIs of this pipeline (variants generated / week,
  human approval latency, conversion uplift per variant) in a shared
  dashboard.
- Prompt-as-code — the prompts in `prompts.py` should be versioned
  separately with their own evaluation tests, so prompt changes are
  reviewable independently of pipeline code.

## References

- PR #913 — implementation
- `services/skod-agent-service/app/lp_optimizer/README.md` — operational doc
- `docs/HOW-WE-OPERATE.md` — parent operating model
- `docs/architecture/ai-native-operations.md` — system-wide architecture
