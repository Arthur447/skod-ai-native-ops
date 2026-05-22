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

## Mission Control CLI

The next increment turned isolated scripts into an interactive terminal
control plane for the AI Factory.

The private implementation now exposes a Mission Control CLI that lets
the operator:

- launch a new migration job from a curated backlog ticket;
- monitor pending human gates;
- approve or reject gates without memorizing command syntax;
- inspect recent factory logs;
- view backlog progress grouped by epic, ticket status, and assignee;
- inspect an audit trail for a selected ticket.

This changed the operating posture from "run scripts in the right
order" to "operate a small delivery system." The CLI is intentionally
terminal-first, because the current audience is the engineering team
working in Warp / shell sessions, not external product users.

## Team Operating Structure

The important design choice is that the factory is not an open-ended
agent prompt. It is framed as a team workflow with explicit operating
rules:

- work starts from a backlog ticket or a curated migration registry;
- each run is attached to one bounded context;
- out-of-scope legacy surfaces are excluded before the operator can
  launch a job;
- the available actions are deliberately narrow: launch, monitor,
  approve, reject, inspect logs, and inspect audit trail;
- human validation gates define where authority sits;
- generated work, gate state, logs, and audit records remain tied to a
  ticket ID.

This makes the workflow handoff-friendly. A teammate can inspect the
ticket, see the active thread, read the gate summary, review logs, and
understand what the factory was allowed to do without relying on an
informal Slack history or a private terminal session.

## Backlog and Migration Registry

The factory now distinguishes two related planning artifacts:

- a migration registry listing eligible legacy modules and their source
  paths;
- a backlog organized by epic and ticket, carrying status, context,
  assignee, and active thread ID when a job is running.

The registry is curated against the parity audit. Surfaces explicitly
classified as out of MVP scope are not offered as migration jobs. This
prevents the AI Factory from making an excluded legacy surface look like
valid work simply because a source file exists.

When a job starts from a backlog ticket, the ticket ID is injected into
factory state and copied into pending gate artifacts. This makes the
human review, generated tests, implementation loop, and audit trail
traceable back to a delivery ticket.

The registry also prevents accidental scope drift. A legacy repository
can contain many modules that are technically discoverable but not part
of the current MVP. The operator interface only exposes the bounded
contexts that have been classified as eligible migration work.

## Test-first Developer Loop

The graph evolved beyond Gate-1 extraction:

1. The Architect node generates a Vitest suite from validated business
   rules and interface contracts.
2. The Developer node generates production TypeScript for the target
   context.
3. The Reviewer node runs the target test file locally.
4. Failed tests loop back to the Developer node with captured reviewer
   output.
5. A bounded iteration count prevents infinite AI repair loops.
6. Persistent failure escalates to a human intervention path.

This is a deliberately conservative red/green loop. AI may attempt the
implementation, but test execution and bounded retry policy control the
state transition.

## Audit Trail

The latest session added a ticket-scoped audit trail for factory
interactions. Each node records:

- timestamp;
- ticket ID;
- actor;
- node name;
- prompt;
- response;
- model.

Runtime audit files are intentionally ignored from the public repository
because raw prompts and responses can contain private source context,
business details, or large generated artifacts. The public repository
documents the logging pattern and governance rationale, not the raw
private execution logs.

## Why This Matters

This pattern demonstrates an AI-native delivery system with explicit
governance:

- AI does the repetitive extraction and orchestration work.
- Humans retain authority over business-rule classification.
- State transitions are deterministic and inspectable.
- Parallel work can proceed without losing review control.
- The team works from shared artifacts instead of individual prompt
  sessions.
- Bounded contexts keep migration scope understandable and reviewable.
- Logs and audit records create a usable handoff trail.
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
- **Delivery observability**: backlog, gates, logs, and audit trail are
  surfaced from one operator interface.
- **Reusable governance**: the same HITL pattern can later apply to
  billing, auth, data migrations, or provider integrations.

## Public-safe Scope

The public repository documents the operating pattern. It does not
publish private implementation code, secrets, raw prompts, legacy source
files, or internal business details.
