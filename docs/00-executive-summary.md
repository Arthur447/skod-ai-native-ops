# Executive Summary

> Three-minute overview for recruiters, CTOs, CPTOs, and transformation
> leads.

## What Skod V2 Is

Skod V2 is a real modernization program used as an AI-native
engineering transformation lab. It takes lessons from a legacy Drupal
product and applies modern platform patterns: TypeScript / Next.js,
modular monolith boundaries, durable asynchronous work, observability,
CI gates, runbooks, and explicit architecture decisions.

The public repository is the operating layer of that program. It shows
how the work is structured, governed, reviewed, and learned from. It is
not a dump of product internals.

## Why This Repo Exists

The repo exists to make transformation leadership visible:

- how scope is controlled;
- how legacy capability is audited before rebuilding;
- how architecture choices are recorded;
- how AI-assisted work is bounded and reviewed;
- how delivery acceleration is balanced with quality and risk control;
- how operating practices are converted into reusable assets.

The intended reader is a recruiter, CTO, CPTO, VP Engineering, Head of
Delivery, or transformation leader evaluating senior engineering
judgment rather than framework familiarity alone.

## Transformation Patterns Demonstrated

- **Modernization sequencing**: move from legacy context to a clear V2
  architecture without pretending everything should be ported.
- **Modular platform design**: bounded contexts, public APIs, and
  provider boundaries before microservice complexity.
- **AI-native governance**: GitHub issues, scoped AI prompts, small PRs,
  CI gates, human review, and delivery learning notes.
- **Human-in-the-loop control**: AI augments implementation and review
  support, while humans own architecture and acceptance.
- **Operational maturity**: runbooks, ADRs, observability, risk
  tracking, and release discipline.
- **Delivery predictability**: work is measured by cycle time, review
  quality, escaped defects, and reusable learning, not prompt volume.

## What To Look At

For a fast read:

1. [Recruiter demo guide](06-recruiter-demo-guide.md)
2. [V1 to V2 modernization case study](case-studies/skod-v1-to-v2-modernization.md)
3. [AI-assisted delivery loop case study](case-studies/ai-assisted-delivery-loop.md)

For technical leadership review:

1. [Architecture docs](architecture/README.md)
2. [ADR index](adr/README.md)
3. [AI team productivity loop](runbooks/ai-team-productivity-loop.md)
4. [Observability runbook](runbooks/observability.md)
5. [Risk register](runbooks/risk-register.md)

## What Is Intentionally Not Public

This public layer excludes product source code, secrets, credentials,
customer data, confidential business detail, internal pricing
experiments, raw prompts, and low-level AI execution logs.

That boundary is intentional. The value of this repo is the operating
model and transformation evidence, not exposure of private product
implementation.
