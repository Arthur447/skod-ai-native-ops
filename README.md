# Skod — AI-Native Operating Model

This is the **public operating layer** of [Skod](https://skod.fr), a
micro-SaaS I build and run as a solo founder. The product code lives
in a private monorepo; this repo is the engineering organization that
makes it possible — architecture, decisions, workflows, roadmap, and
the tooling I use to operate the company with supervised AI agents.

## What Skod is

> Skod is the Calendly for paid email responses.

Put a Skod link in your LinkedIn / Twitter / email signature /
linktree. Anyone clicks it, pays the price you configured, and sends
you a message. You reply from your normal Gmail or Outlook inbox —
no new platform to learn. Skod handles payment capture, SLA
enforcement (refund on timeout), and reply detection.

Full details in [`docs/VISION.md`](docs/VISION.md).

## Start here (15 min read)

If you are a recruiter, a potential collaborator, or just curious
about how a solo founder simulates a 10-engineer team with agents,
read in this order:

1. [`docs/META-PLAN.md`](docs/META-PLAN.md) — the 7-level vision
   cascade and where each artefact sits in it (entry point).
2. [`docs/VISION.md`](docs/VISION.md) — what Skod is at 3 years,
   what it is **not**, the target user archetypes.
3. [`docs/HOW-WE-OPERATE.md`](docs/HOW-WE-OPERATE.md) — operating
   principles (bounded contexts, Human-in-the-Loop on irreversible
   actions, guidelines-in-CI-not-in-wiki).
4. [`docs/architecture/ai-native-operations.md`](docs/architecture/ai-native-operations.md) —
   system architecture with a Mermaid diagram covering the
   engineering workflow AND the product-facing agents.
5. [`docs/adr/`](docs/adr/) — three Architecture Decision Records
   (LP Optimizer pipeline, 360° AI-native principles, Landing Page
   Manager architecture).
6. [`docs/ROADMAP-ai-native-organization.md`](docs/ROADMAP-ai-native-organization.md) —
   14 priorities sequenced across engineering and non-engineering.
7. [`docs/backlog/skd-1003-execution-log.md`](docs/backlog/skd-1003-execution-log.md) —
   one ticket executed end-to-end through the AI-native workflow
   (planner agent → human validation → coder agent → reviewer agent
   → merge). The git log itself IS the demonstration.

## Companion tooling

- [`rnd/ai-native-tooling/`](rnd/ai-native-tooling/) — R&D tooling:
  dep-cruiser boundary rules, jscpd cross-module duplication
  detection, and a standalone TypeScript MCP server that exposes
  Skod state to Claude Code for development velocity.
- [`.github/workflows/ai-native-enforcement.yml`](.github/workflows/ai-native-enforcement.yml) —
  the CI workflow that enforces boundary rules + duplication
  threshold + Python service tests on every PR of the private
  monorepo. Included here as a reference pattern; it does not run
  operationally on this repo because the target paths live in the
  private codebase.

## Why this repo exists

Most public engineering artefacts from solo founders are either demos
(Cursor / Claude Code screenshots, one-off experiments) or thought
pieces (blog posts about theory). This repo is the **working
artefact** — the living documents maintained as Skod evolves.

Each artefact is updated as I learn: the roadmap's progress log, the
META-PLAN's session log, the ADRs' follow-ups. A reviewer opening
this repo in six months will see how the organization has evolved,
not a snapshot.

The goal: demonstrate, in git, what AI-native engineering leadership
looks like at solo-founder scale — before and regardless of whether
I take that role at scale for someone else's organization.

## What this repo does NOT contain

- The Skod product code (Drupal monorepo + Python agent service)
- Business-confidential information (customer data, internal pricing
  experiments, unreleased marketing material)
- Any financial, customer, or regulated data

Those live in a separate private monorepo. This repo is maintained
as a public-safe synchronization of the operating-model folders only.

## About

Arthur Collenot — building Skod, and this operating model, in public.
Reach me at arthur447@gmail.com.
