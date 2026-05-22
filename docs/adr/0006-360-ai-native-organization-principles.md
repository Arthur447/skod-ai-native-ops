# ADR 0006 — 360° AI-Native Organization Principles

- **Status**: Accepted
- **Date**: 2026-04-17
- **Decision maker**: VP Engineering (Arthur Collenot)
- **Bounded context**: cross-company operating model
- **Parent of**: ADR 0007 (LPM architecture — first concrete
  application of these principles)

## Context

Skod is operated by a single human today. The engineering operating
model (see `docs/HOW-WE-OPERATE.md`) applies AI-native principles
(agents + HITL + bounded contexts + eval-driven iteration) to the
technical side of the business. Private implementation increments and
enforcement-tooling R&D are concrete expressions of those principles on
the engineering slice.

The strategic question is whether to extend these principles
**beyond engineering** — to marketing, product, customer success,
sales, operations, and strategic intelligence — such that **every
business function** is operated by a supervised agent under the same
discipline: one agent per bounded context, HITL on irreversible
actions, eval-driven iteration, prompt-as-code.

Why now? Skod's positioning as a reference implementation for
AI-native organizations is the professional differentiator. An
engineering-only AI-native stack is commoditizing. A *whole-company*
AI-native organization, publicly demonstrable through governance docs,
does not yet have a canonical reference in the market.

## Decision

Adopt a **360° AI-native operating model** for Skod. Every
business function can have agents; all agents follow the same four
governing principles, regardless of whether they are engineering or
non-engineering.

### Principle 1 — One agent per bounded context

No god-agent spans multiple business functions. The landing-page
optimizer does not also do SEO content. The customer support agent
does not also close sales. The boundary between agents mirrors the
boundary between business domains. This mirrors how DDD bounded
contexts shape engineering modules — and for the same reason:
unclear ownership produces degraded quality over time.

### Principle 2 — Human-in-the-Loop on irreversible actions

Every agent can propose, draft, analyze, synthesize. No agent can
publicly publish, spend money, or mutate customer data without a
human one-click approval. The permissioning rule is the same as
engineering (reversibility × magnitude of impact, see ADR 0001):

| Action | Control |
|---|---|
| Reversible + low impact | Autonomous, logged |
| Reversible + medium impact | Autonomous with post-hoc audit |
| Irreversible (money, public, customer data) | **HITL required** |

### Principle 3 — One new agent at a time, proven before the next

The temptation is to spin up five or ten agents in parallel. This
is the demo-theater trap — agents look impressive on a repo map
but produce medium-quality output that won't hold up to forensic
review. Discipline: one agent in active development, prove it with
measurable impact (KPIs, eval scores, business metric it moved),
then start the next.

### Principle 4 — ROI-aligned to the business's current stage

The first non-engineering agent is not the one that looks most
impressive; it is the one that addresses the current business
bottleneck. For Skod today (PMF validation, 0 conversion on
300 ad-sourced visits), that is marketing iteration (P10). For a
Skod in growth phase (post-PMF), it would be user research synthesis
or lead qualification. Agent priority is **always** subordinate to
the business's current growth lever.

## Alternatives considered

### A. Build 5-10 agents in parallel

*Rejected.* The current operating reality is one primary operator. Each agent requires 1-2 weeks
of focused work to reach production quality, plus ongoing prompt
tuning and eval iteration (~30 min/week/agent). Five agents built
in parallel = none will be production-quality; the CV asset
becomes a liability when a reviewer opens the repo.

### B. Stay engineering-only until team grows to 5+

*Rejected.* The professional differentiation comes from demonstrating
the 360° pattern before a larger team exists. Waiting for a team to
materialize before extending the model means the operating asset is
never built.

### C. Build only SaaS-ready tooling (generic, productizable)

*Rejected.* Skod is the business, not the product. Generic SaaS
tooling (Gumloop, Lindy, Clay) already exists at market. The
differentiator is **operating** a real business with agents, not
building another agent platform.

## Consequences

### Positive

- **Singular professional positioning**. The public operating layer can
  credibly demonstrate a whole-company AI-native organization pattern,
  not only isolated engineering automation.
- **Skod business acceleration**. Each agent is chosen for ROI
  against the current business bottleneck, so the operating-model
  investment doubles as product/growth investment.
- **Scalable operating model**. When Skod hires, the operating
  model is already in place. Humans join an existing structure
  instead of inventing one on the fly.
- **Composable with existing work**. The engineering operating model,
  enforcement tooling, and AI-assisted delivery practices plug into the
  360° model cleanly — engineering becomes one of several functions
  governed by the same principles.

### Negative / Risks

- **Discipline cost**. The one-at-a-time rule is strict and can feel
  slow. Mitigation: publish the roadmap visibly so progress and
  tradeoffs are reviewable.
- **Cost of tokens / tool fees**. Each running agent consumes API and
  tool budget. Cost is tracked as an operating KPI and revisited if the
  number of active agents doubles.
- **Risk of agent output degradation**. Any agent can drift as
  the business evolves. Mitigation: mandatory monthly eval review
  per agent once in production, with roll-back authority if the
  quality drops below threshold. Formalized with roadmap P4
  (eval harness).

## Application — mapping Skod's business to bounded contexts

| Function | Bounded context | Status / first agent |
|---|---|---|
| Engineering | Product engineering workflow | Operating model in place |
| Marketing | Landing pages, ads, content | First non-engineering chantier |
| Product | Roadmap, feature prioritization | Deferred until user volume |
| Sales / Growth | Acquisition, lead funnel | Not yet |
| Customer Success | Consultation answering | Partial supervised-agent pattern |
| Operations | Finance, legal, compliance | Premature at solo scale |
| Strategic / Exec | Competitive intel, briefings | Deferred until multiple agents are in place |

## Follow-ups

- ADR 0007 — Landing Page Manager architecture (concrete first
  non-engineering application of these principles).
- ADR 0008 (future) — Eval harness governance, once multiple agents
  need systematic eval infrastructure (also roadmap P4).
- Quarterly review of this ADR: as agents come online and patterns
  emerge, refine the principles. This document is versioned and
  meant to evolve.

## References

- [`docs/HOW-WE-OPERATE.md`](../HOW-WE-OPERATE.md) — engineering
  operating model (the original slice)
- [`docs/ROADMAP-ai-native-organization.md`](../ROADMAP-ai-native-organization.md) —
  living roadmap, Part 2 (P9-P14) formalizes non-engineering scope
- [`docs/adr/0001-lp-optimizer-architecture.md`](0001-lp-optimizer-architecture.md) —
  origin of the HITL-on-irreversible pattern
