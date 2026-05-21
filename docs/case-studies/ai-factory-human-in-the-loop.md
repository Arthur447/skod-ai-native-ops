# Case Study: AI Factory With Human-in-the-loop Gates

## Purpose

This case study documents a recent R&D increment in the private Skod V2
engineering repo: a TypeScript LangGraph prototype for an AI-assisted
delivery factory.

The goal was not to automate delivery end to end. The goal was to prove
an industrial control pattern: AI can extract and prepare migration
work, but human validation remains a deterministic gate before
implementation continues.

## What Was Built

The private implementation introduced an `ai-factory` workspace for a
delivery-agent graph:

1. **Analyst** extracts business rules from legacy source files.
2. **Architect** prepares the testing and implementation strategy.
3. **Developer** drafts implementation work.
4. **Reviewer** checks output and can loop back to development.

The graph is implemented as a state machine using LangGraph.js and
TypeScript. The state carries the legacy file path, bounded context,
business rules, generated test and production code, errors, iteration
count, and human feedback.

## Gate-1: Human Validation Before Implementation

The first production-grade control is Gate-1: after the analyst extracts
business rules, the graph interrupts deterministically.

This interruption creates a human review point before any downstream
implementation node runs. The pattern is intentionally conservative:

- AI may propose a business-rules matrix.
- Humans validate, reject, or correct that matrix.
- Only validated rules are allowed to move toward test and
  implementation work.

This directly supports migration governance: legacy behavior extraction
is not automatically implementation scope.

## Asynchronous HITL Hub

The prototype evolved from an interactive terminal approval into an
asynchronous human-in-the-loop hub.

When Gate-1 is reached, the run script writes two transit artifacts:

- a JSON state snapshot for machine processing;
- a Markdown report for human review.

The terminal is then released. This allows multiple contexts to run in
parallel without blocking a developer session.

An approval script can later list pending gates, approve a gate, reject
a gate, or approve with natural-language feedback.

## Natural-language Feedback Loop

The approval workflow supports CTO feedback such as:

```text
Ignore framework-only behavior and keep only Stripe subscription rules.
```

When feedback is provided, the graph does not continue to implementation.
It routes back to the analyst step and regenerates the business-rules
extraction using the feedback as authoritative correction.

This creates a controlled review loop:

1. AI extracts rules.
2. Human corrects the extraction.
3. AI revises the rules.
4. Human validates the revised Gate-1 output.
5. Only then does the graph continue.

## Context Contracts

The factory also reads a public contracts registry before extraction.
The registry is designed to centralize inter-context signatures,
domain-facing types, and integration events.

This prevents isolated AI runs from inventing incompatible module
boundaries. Each extraction is contextualized by the contracts already
established elsewhere in the platform.

## Slack Notification Layer

The latest increment added optional Slack webhook notifications.

If a webhook is configured, Gate-1 emits an asynchronous notification
with:

- context name;
- thread ID;
- business-rules summary;
- approval command.

If the webhook is absent, the system falls back to console logging. This
keeps local development and CI-friendly scripts non-blocking.

## Why This Matters

This pattern demonstrates an AI-native delivery system with explicit
governance:

- AI does the repetitive extraction and orchestration work.
- Humans retain authority over business-rule classification.
- State transitions are deterministic and inspectable.
- Parallel work can proceed without losing review control.
- Feedback becomes part of the workflow rather than an informal chat
  side-channel.

For a modernization program, this is the difference between using AI as
a code generator and using AI as a governed delivery subsystem.

## Leadership Takeaways

- **Throughput without blind automation**: multiple contexts can be
  prepared in parallel while preserving human gates.
- **Migration risk control**: extracted legacy behavior is reviewed
  before implementation begins.
- **Architecture discipline**: contracts are made visible to the agent
  before it reasons about a module.
- **Operational readiness**: pending gates are persisted as reviewable
  artifacts and can notify reviewers asynchronously.
- **Reusable governance**: the same HITL pattern can later apply to
  billing, auth, data migrations, or provider integrations.

## Public-safe Scope

The public repository documents the operating pattern. It does not
publish private implementation code, secrets, raw prompts, legacy source
files, or internal business details.
