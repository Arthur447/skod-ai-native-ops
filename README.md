# Skod V2 — AI-native Engineering Transformation Lab

> Public operating layer of a real modernization program: how a legacy
> Drupal product is being reshaped into a modular, observable,
> AI-assisted delivery system under human governance.

This repository is not positioned as a low-level AI tooling demo. It is
a recruiter-facing transformation lab showing how senior engineering
leadership can use AI to improve delivery throughput while keeping
architecture, risk, and product accountability under human control.

## What This Is

Skod V2 is the modernization track for an existing Skod product. The
public repo documents the operating model, engineering governance, and
architecture patterns used in the transformation:

- AI-native delivery governance: GitHub issues, scoped prompts, small
  PRs, CI gates, review discipline, and learning loops.
- Engineering transformation: moving from a Drupal legacy context to a
  TypeScript / Next.js modular monolith.
- Platform modernization: explicit module boundaries, typed contracts,
  outbox-first asynchronous work, worker transport, observability, and
  provider boundaries.
- Human-in-the-loop control: AI accelerates execution, but humans own
  architecture, acceptance criteria, review decisions, and risk.
- Delivery predictability: Definition of Done, ADRs, runbooks,
  risk register, parity audit, and measurable delivery feedback.

Arthur Collenot uses Skod V2 as a real-world lab for CTO, Technical
Program, and Transformation Lead work: operating model design,
modernization sequencing, AI-assisted delivery operations, and
governance that can scale beyond one maintainer.

## Start Here

| Path | Why it matters |
|---|---|
| [Executive summary](docs/00-executive-summary.md) | Three-minute overview for recruiters, CTOs, CPTOs, and transformation leads. |
| [Recruiter demo guide](docs/06-recruiter-demo-guide.md) | Five-minute and fifteen-minute reading paths by target role. |
| [V1 to V2 modernization case study](docs/case-studies/skod-v1-to-v2-modernization.md) | Legacy-to-modern platform patterns and leadership takeaways. |
| [AI-assisted delivery loop case study](docs/case-studies/ai-assisted-delivery-loop.md) | How AI work is scoped, gated, reviewed, and converted into learning. |
| [Architecture docs](docs/architecture/README.md) | Current platform shape, request flow, module map, durable jobs, and related diagrams. |
| [Runbooks](docs/runbooks/README.md) | Operational discipline for onboarding, release, observability, workers, and AI productivity. |
| [ADRs](docs/adr/README.md) | Repository-scoped architecture decisions and governance records. |

## Operating Model

The operating model is deliberately conservative:

1. GitHub issue defines scope and acceptance criteria.
2. AI assistant receives a bounded task with relevant repo context.
3. Work lands in a small PR.
4. CI validates build, lint, type checks, and tests.
5. Human review owns architecture, product judgment, and merge
   readiness.
6. AI productivity notes capture what accelerated delivery and what
   created rework.
7. Repeated corrections become durable assets: tests, runbooks, ADRs,
   prompts, or boundary rules.

The point is not that AI replaces a team. The point is that AI can
augment execution inside a disciplined delivery system where humans
retain accountability.

## Modernization Themes Demonstrated

- **Modular monolith direction**: bounded contexts and public module
  APIs before distributed-system complexity.
- **CI build gate**: mechanical quality checks before human review.
- **Outbox-first architecture**: durable async handoff rather than
  fragile side effects inside request flows.
- **BullMQ worker transport**: background processing as an explicit
  operational concern.
- **Observability**: `/api/metrics`, runbooks, and delivery signals
  make the system inspectable.
- **Provider boundaries**: email, payment, and auth providers are kept
  behind module contracts.
- **Inbound reply migration**: EmailConnect-style inbound mail handling
  is treated as a platform capability, not a scattered integration.

## What Is Public

This repo is safe-to-share documentation and operating material:

- architecture notes and ADRs;
- runbooks and onboarding guides;
- modernization case studies;
- delivery governance patterns;
- public summaries of AI-assisted engineering practice.

## What Is Intentionally Not Public

The public lab does not include:

- confidential product source code;
- secrets, credentials, tokens, or environment values;
- customer data;
- internal pricing experiments;
- private business details;
- raw prompts or low-level Codex logs;
- vendor-specific operational details that would increase security
  risk.

## About Arthur Collenot

Arthur Collenot is a CTO / Technical Program / Transformation Lead
profile with 18 years of product, engineering, and delivery experience.
This repository is a portfolio-grade evidence trail for modernization
leadership: making technical direction explicit, turning AI into a
controlled delivery accelerator, and building governance that improves
predictability instead of hiding risk.

## License

No license is currently granted for reuse of the repository contents
unless stated otherwise in a future license file.
