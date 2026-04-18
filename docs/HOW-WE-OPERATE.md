# How we operate

Skod is a multi-tenant marketplace for independent consultants, operated as
an **AI-native engineering organization**. This document is the short
manifesto of how we run the shop.

It describes the target state for a team of 10 engineers. The practices
here are applied today even at a smaller headcount — so that scaling the
team does not require inventing the operating model on the spot.

> For the architecture diagram and the HITL decision matrix, see
> [`docs/architecture/ai-native-operations.md`](architecture/ai-native-operations.md).

## What we believe

1. **AI-native is about the operating model, not the tooling.** The tools
   are a small part. The hard part is how humans and agents share the work,
   where the gates are, and how quality is kept.
2. **The human is never removed — the human moves up.** Engineers stop
   writing every line of code; they start arbitraging, writing specs,
   reviewing outputs, owning the standards that agents implement.
3. **Guidelines live in the CI, not in a wiki.** If an architectural
   constraint matters, it is enforced by a machine check, not by goodwill.
4. **Irreversible actions always require a human click.** Money moving,
   public-facing publishing, deletion: never autonomous.
5. **Prototype fast, refactor when debt starts to cost — both visible in
   the git log.** The iteration is the learning. We do not squash it away.

## How a ticket flows

```
Product / PMF signal          (human)
    → Gherkin ticket           (human: spec + risk tier + budget)
    → Ready to plan            (Jira state)
    → Planner agent            (agent: plan + estimated cost)
    → Plan validation          (human: 1-click approve / adjust)
    → Dev Ready                (Jira state)
    → Coder agent              (agent: code against tests)
    → Review orchestrator       (agent: spawns sub-agents: security / perf / quality)
    → CI (dep-cruiser + jscpd + tests)
    → Pending Dev review        (human: final review, weight depends on risk tier)
    → Merge
    → Staging (feature flag)
    → Rollout                  (progressive: 1% → 10% → 100%, KPIs watched)
```

Critical tickets (payment flows, public-facing publishing, auth, data
destruction) have extra gates: explicit risk-tier tag in Jira, mandatory
human review by the tech lead of the bounded context, progressive rollout.

## How quality is kept

- **Enforcement in CI** via
  [`rnd/ai-native-tooling/dep-cruiser.config.cjs`](../rnd/ai-native-tooling/dep-cruiser.config.cjs)
  (boundary rules) and
  [`rnd/ai-native-tooling/jscpd.config.json`](../rnd/ai-native-tooling/jscpd.config.json)
  (duplication threshold 5%). Both block PRs on violation.
- **Fitness functions** — architecture invariants are tested. A service
  cannot import another bounded context silently.
- **Separation of intent and implementation** — humans write acceptance
  criteria (Gherkin), agents write tests and implementation. The same agent
  never owns both spec and code, or tests become tautological.
- **Prompt-as-code** — prompts and agent instructions live in a versioned
  repository, reviewed as code, improved continuously based on eval metrics.
  When an output drifts, the RCA targets the prompt, not the human.

## Roles (target state for 10)

Scope is fixed even when one person wears many hats today.

- **VP Engineering** — system, budget, standards, hiring bar, risk tiers.
- **Tech Leads per bounded context** — own the Gherkin templates, the
  plan-validation gate, the KPIs of their domain.
- **AI Platform Engineer** — MCP servers, prompt library, evaluation infra,
  provider abstractions (`AiProviderBridge`, `EmbeddingBridge`).
- **Quality Engineer** — CI enforcement rules, KPIs, RCA, observability.
- **Product Ops** — HITL approvals on product-facing actions (Slack
  approvals for LP variants, consultation flags).

Engineers in this model are **supervisors of agents who also understand
code deeply** — closer to Staff Engineers than to juniors writing CRUDs.
New hires are recruited primarily on judgment, system thinking and review
rigor. Raw coding throughput has ceased to be the differentiator.

## KPIs

Business KPI (the one that matters): **conversion rate of the signup
funnel** — from Meta Ads click to paying consultant. Everything below
serves this end.

Operating KPIs (how the engineering machine is doing):

- **Rework rate** — % tickets needing > 1 agent iteration
- **Code survival at 30d** — % AI-generated code still present after a month
- **Cost per ticket (USD)** — Claude API spend per merged ticket
- **HITL latency** — time from agent-ready to human decision
- **Hallucination rate** — PRs rejected for factually wrong content

## Current state (honest snapshot)

- Single-engineer headcount, operating the model above to prove it at small
  scale and to be ready for growth.
- Enforcement tooling (dep-cruiser, jscpd) set up, not yet wired into CI —
  next step.
- MCP server for consultations exists locally for Claude Code dev velocity —
  local only, not deployed.
- First cross-context AI application: the LP Optimizer pipeline in PR #913
  (Meta Ads → GA4 → Claude → Slack HITL → landing variant activation).
- What is missing vs. target: CI gating on the linters, eval infra, audit
  trail centralization, prompt library.

## See also

- [`docs/architecture/ai-native-operations.md`](architecture/ai-native-operations.md)
  — full Mermaid diagram and HITL decision matrix
- PR #913 — concrete application: LP Optimizer + AI Agent infrastructure
- [`rnd/ai-native-tooling/NOTES.md`](../rnd/ai-native-tooling/NOTES.md) — enforcement tooling and MCP server R&D notes
