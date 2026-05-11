# Observability

## Pattern

Observability is treated as part of the delivery system. The public
pattern is to expose useful operational signals, document what they
mean, and use them during review and incident analysis.

`/api/metrics` is referenced as the public example of a metrics surface,
not as a disclosure of private production monitoring.

## Why It Matters

Transformation programs need evidence, not only implementation activity.
Observability helps answer:

- is the system healthy;
- did a change affect delivery reliability;
- are background jobs progressing;
- where should review or operational attention go next.

For AI-assisted delivery, observability also limits blind automation:
changes must produce inspectable behavior.

## What Is Not Public

This page does not expose production metrics, dashboards, alerts,
incident logs, customer identifiers, provider details, or infrastructure
configuration.
