# Case Study: AI-assisted Delivery Loop

## Purpose

This loop shows how AI is used as a delivery accelerator under human
governance. It is designed for controlled throughput, not blind
automation.

The goal is to improve delivery outcomes: shorter cycle time, better
first-pass review quality, fewer rework loops, faster onboarding to
existing patterns, and durable learning captured in the repo.

## Delivery Flow

### 1. GitHub Issue As Source Of Truth

Each non-trivial change starts from a GitHub issue or equivalent ticket.
The issue defines the target outcome, scope, acceptance criteria, and
known constraints.

This keeps AI work anchored to delivery intent instead of open-ended
generation.

### 2. Scoped Codex Prompt

The AI assistant receives a bounded prompt with the relevant files,
constraints, expected verification, and human-owned decisions. Broad
requests are split into smaller implementation units.

The prompt is not treated as authority. It is an execution brief inside
the existing engineering system.

### 3. Small PR

Work is expected to land as a small pull request. Small PRs reduce
review latency, make architecture drift easier to spot, and keep
rollback risk manageable.

### 4. CI Gates

Mechanical gates run before human review. Build, lint, type checks,
tests, and repo-specific validation catch low-level defects early.

CI does not replace review. It protects review time.

### 5. Human Architecture Review

Human review owns architecture, product behavior, risk, acceptance
criteria, and merge readiness. AI can help find issues, explain code, or
draft changes, but it does not approve its own work.

This is the main control point in the loop.

### 6. AI Productivity Notes

Each meaningful AI-assisted PR records concise productivity notes:

- what AI role was used;
- what acceleration was useful;
- what human corrections were required;
- what context was missed;
- what reusable artifact was created;
- whether the net result was faster, neutral, or slower.

See the [AI team productivity loop runbook](../runbooks/ai-team-productivity-loop.md).

### 7. Learning Loop

Recurring corrections become durable assets: tests, lint rules, ADRs,
runbooks, issue templates, prompt patterns, or module boundary rules.

The system learns only when the next similar ticket requires less
human explanation, less review cleanup, or less rework.

## Why This Is AI-native Governance

This is AI-native because AI is integrated into the delivery operating
model: planning, implementation support, review support, verification,
and learning capture.

It is governance because the system defines where authority sits:

- issue scope defines intent;
- CI defines mechanical quality gates;
- ADRs and runbooks define durable decisions;
- humans own architecture and acceptance;
- productivity notes measure delivery impact, not prompt activity.

The operating principle is simple: AI augments execution under human
governance.
