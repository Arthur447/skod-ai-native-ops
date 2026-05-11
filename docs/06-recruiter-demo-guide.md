# Recruiter Demo Guide

## Five-minute Reading Path

Use this path to understand the positioning quickly:

1. [README](../README.md) for the lab framing.
2. [Executive summary](00-executive-summary.md) for the three-minute
   leadership overview.
3. [AI-assisted delivery loop](case-studies/ai-assisted-delivery-loop.md)
   for the governance model.

## Fifteen-minute Reading Path

Use this path for a more serious screen:

1. [Executive summary](00-executive-summary.md)
2. [V1 to V2 modernization case study](case-studies/skod-v1-to-v2-modernization.md)
3. [AI-assisted delivery loop case study](case-studies/ai-assisted-delivery-loop.md)
4. [Architecture overview](architecture/README.md)
5. [ADR index](adr/README.md)
6. [AI team productivity loop](runbooks/ai-team-productivity-loop.md)
7. [Observability runbook](runbooks/observability.md)

## What To Look At By Role

### CTO / VP Engineering

Look for architecture tradeoffs, modular platform direction, explicit
boundaries, observability, risk handling, and the choice to keep AI
inside a governed delivery system.

Recommended files:

- [V1 to V2 modernization case study](case-studies/skod-v1-to-v2-modernization.md)
- [Architecture overview](architecture/README.md)
- [Module map](architecture/module-map.md)
- [Durable jobs and outbox architecture](architecture/durable-jobs-outbox.md)
- [ADR index](adr/README.md)

### Technical Program / Delivery Lead

Look for sequencing, scope control, Definition of Done discipline,
release thinking, runbooks, risk tracking, and feedback loops.

Recommended files:

- [AI-assisted delivery loop](case-studies/ai-assisted-delivery-loop.md)
- [AI team productivity loop](runbooks/ai-team-productivity-loop.md)
- [Release process](runbooks/release-process.md)
- [Risk register](runbooks/risk-register.md)
- [Feature parity audit](feature-parity-audit.md)

### Transformation Lead

Look for the operating model: how legacy capability becomes a modern
platform, how AI changes delivery mechanics, and how governance prevents
speed from turning into unmanaged risk.

Recommended files:

- [Executive summary](00-executive-summary.md)
- [V1 to V2 modernization case study](case-studies/skod-v1-to-v2-modernization.md)
- [AI-assisted delivery loop](case-studies/ai-assisted-delivery-loop.md)
- [Drupal to V2 architecture guide](architecture/drupal-to-v2-architecture-guide.md)
- [Observability runbook](runbooks/observability.md)

## Relationship To Private Product Code

This public repository is a curated operating layer. It shows
architecture direction, governance, runbooks, case studies, and
transformation patterns.

It does not expose confidential product source code, secrets, customer
data, raw prompts, low-level Codex logs, private pricing experiments, or
business-sensitive implementation detail.

The intended signal is leadership practice: how the modernization is
structured, controlled, reviewed, and improved over time.
