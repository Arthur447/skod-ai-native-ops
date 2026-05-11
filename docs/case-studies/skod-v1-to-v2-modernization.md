# Case Study: Skod V1 To V2 Modernization

## Context

Skod V1 comes from a Drupal legacy context. The modernization target is
not a line-by-line rewrite. The V2 direction keeps the useful lessons of
the previous system while replacing implicit framework coupling with
explicit platform boundaries, typed contracts, observable flows, and
delivery governance.

The leadership challenge is typical of real modernization work: preserve
business capability, reduce hidden coupling, avoid big-bang rewrite
risk, and create a platform that can evolve under delivery pressure.

## V2 Direction

Skod V2 moves toward a TypeScript / Next.js modular monolith. The choice
is deliberate: the system needs clear boundaries and operational
discipline before it needs distributed-system complexity.

The modernization is organized around bounded contexts, durable job
handoff, provider abstraction, CI gates, and runbooks. This creates a
platform that is easier to review, easier to operate, and easier for
AI-assisted contributors to work in without crossing architectural
boundaries by accident.

## Key Modernization Patterns

### Modular Monolith

V2 uses module boundaries and public APIs to separate concerns such as
auth, billing, email, threads, professional profiles, visitors, agents,
and admin operations. Internal implementation details stay behind module
contracts.

This keeps the architecture understandable while avoiding premature
microservices.

### CI Build Gate

Mechanical checks run before human review. The gate is designed to catch
formatting, lint, type, test, and build regressions early so human
review can focus on architecture, product behavior, and risk.

### Outbox-First Architecture

Side effects are treated as durable work, not incidental request-flow
logic. The outbox pattern gives the system a record of pending work,
retry behavior, and failure visibility.

See [durable jobs and outbox architecture](../architecture/durable-jobs-outbox.md).

### BullMQ Worker Transport

Background work is handled through a worker transport rather than
hidden synchronous side effects. This makes delivery operations more
observable and gives the team a clearer place to reason about retries,
back pressure, and worker failures.

See the [local workers runbook](../runbooks/local-workers.md).

### `/api/metrics` Observability

The platform exposes operational signals through `/api/metrics` and
documents how to interpret them. Observability is treated as part of the
delivery system, not an afterthought added after incidents.

See the [observability runbook](../runbooks/observability.md).

### Email Provider Boundary

Email delivery is isolated behind a provider boundary. That keeps route
logic and domain orchestration from depending directly on vendor
details.

See the [email flow architecture](../architecture/email-flow.md).

### EmailConnect Inbound Reply Migration

Inbound email replies are treated as a product and platform capability.
The migration path keeps EmailConnect-style inbound handling explicit:
parse inbound messages, map them to domain state, preserve auditability,
and keep provider details outside core business flows.

See the [EmailConnect inbound runbook](../runbooks/emailconnect-inbound.md).

## Leadership Takeaways

- Modernization is an operating model problem, not only a stack change.
- A modular monolith can be the right intermediate architecture when the
  goal is control, speed, and comprehensibility.
- AI-assisted delivery works better when architecture boundaries are
  explicit and mechanically checked.
- CI, observability, ADRs, and runbooks reduce review burden and make
  delivery more predictable.
- The strongest transformation signal is not code volume. It is the
  ability to make tradeoffs visible, govern risk, and turn learning into
  repeatable practice.
