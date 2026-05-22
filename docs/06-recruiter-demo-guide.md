# Recruiter Demo Guide

## What This Page Demonstrates

This repository is a public operating dossier for a private engineering
program. Its main signal is not "AI wrote code." The signal is that the
work is structured so a team can use AI safely inside a controlled
delivery system.

The strongest example is the AI Factory workstream:

- migration work is scoped by bounded context;
- jobs start from a curated backlog or migration registry;
- operators have a limited action set, not an open-ended agent console;
- business-rule extraction stops at a human approval gate;
- logs, audit trail, thread IDs, and ticket IDs make work reviewable;
- private code, prompts, secrets, and raw execution logs stay out of
  the public repository.

For a recruiter or hiring manager, this is the angle to evaluate: the
project shows engineering leadership around team standards, scope
control, auditability, and safe AI-assisted delivery.

## Five-minute Reading Path

Use this path to understand the positioning quickly:

1. [README](../README.md) for the lab framing.
2. [Executive summary](00-executive-summary.md) for the three-minute
   leadership overview.
3. [AI-assisted delivery loop](case-studies/ai-assisted-delivery-loop.md)
   for the governance model.
4. [AI Factory with HITL gates](case-studies/ai-factory-human-in-the-loop.md)
   for the newest delivery-orchestration R&D increment.

## Fifteen-minute Reading Path

Use this path for a more serious screen:

1. [Executive summary](00-executive-summary.md)
2. [V1 to V2 modernization case study](case-studies/skod-v1-to-v2-modernization.md)
3. [AI-assisted delivery loop case study](case-studies/ai-assisted-delivery-loop.md)
4. [AI Factory with HITL gates](case-studies/ai-factory-human-in-the-loop.md)
5. [Architecture overview](architecture/README.md)
6. [ADR index](adr/README.md)
7. [AI team productivity loop](runbooks/ai-team-productivity-loop.md)
8. [Observability runbook](runbooks/observability.md)

## What To Look At By Role

### Team-readiness Signal

The AI Factory case study is meant to show more than agent usage. It
shows how the work is structured so several people can operate the same
system without relying on personal prompt history or private terminal
state.

Concrete signals to look for:

- **Standards**: runbooks, ADRs, Definition of Done discipline, and
  documented architecture tradeoffs.
- **Scope control**: bounded contexts, MVP migration registry, and
  explicit exclusion of out-of-scope legacy surfaces.
- **Human authority**: approval gates before AI output becomes
  implementation scope.
- **Traceability**: ticket-linked runs, thread IDs, pending gate
  artifacts, logs, and audit trail.
- **Limited actions**: the operator can launch, monitor, approve,
  reject, and inspect. The workflow is intentionally framed.
- **Public/private boundary**: the public repo explains governance
  without exposing confidential implementation detail.

That is the intended hiring signal: AI is treated as part of a team
engineering operating system, not as an unbounded code-generation tool.

### CTO / VP Engineering

Look for architecture tradeoffs, modular platform direction, explicit
boundaries, observability, risk handling, and the choice to keep AI
inside a governed delivery system.

Recommended files:

- [V1 to V2 modernization case study](case-studies/skod-v1-to-v2-modernization.md)
- [Architecture overview](architecture/README.md)
- [AI Factory with HITL gates](case-studies/ai-factory-human-in-the-loop.md)
- [Durable jobs and outbox architecture](architecture/durable-jobs-outbox.md)
- [ADR index](adr/README.md)

Module map: Private implementation detail -- summarized in this public
case study.

### Technical Program / Delivery Lead

Look for sequencing, scope control, Definition of Done discipline,
release thinking, runbooks, risk tracking, and feedback loops.

Recommended files:

- [AI-assisted delivery loop](case-studies/ai-assisted-delivery-loop.md)
- [AI Factory with HITL gates](case-studies/ai-factory-human-in-the-loop.md)
- [AI team productivity loop](runbooks/ai-team-productivity-loop.md)

Release process, risk register, and detailed parity audit: Private
implementation detail -- summarized in this public case study.

### Transformation Lead

Look for the operating model: how legacy capability becomes a modern
platform, how AI changes delivery mechanics, and how governance prevents
speed from turning into unmanaged risk.

Recommended files:

- [Executive summary](00-executive-summary.md)
- [V1 to V2 modernization case study](case-studies/skod-v1-to-v2-modernization.md)
- [AI-assisted delivery loop](case-studies/ai-assisted-delivery-loop.md)
- [AI Factory with HITL gates](case-studies/ai-factory-human-in-the-loop.md)
- [Observability runbook](runbooks/observability.md)

Detailed Drupal-to-V2 mapping: Private implementation detail --
summarized in this public case study.

## Relationship To Private Product Code

This public repository is a curated operating layer. It shows
architecture direction, governance, runbooks, case studies, and
transformation patterns.

It does not expose confidential product source code, secrets, customer
data, raw prompts, low-level Codex logs, private pricing experiments, or
business-sensitive implementation detail.

The intended signal is leadership practice: how the modernization is
structured, controlled, reviewed, and improved over time.
