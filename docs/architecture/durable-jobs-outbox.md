# Durable Jobs And Outbox

## Pattern

The outbox pattern treats side effects as durable work. Instead of
performing every external action directly inside a request flow, the
system records an intended action and lets worker processing handle the
delivery, retry, and failure path.

In Skod V2, this pattern supports background work such as outbound
notifications, asynchronous processing, and operational recovery.

## Why It Matters

For modernization work, the outbox pattern creates control:

- request flows stay focused on domain state;
- retries become visible and governable;
- failures can be inspected instead of disappearing inside a request;
- AI-assisted changes have a clearer architectural boundary to follow.

This improves delivery predictability because asynchronous work is part
of the platform design, not a hidden side effect.

## What Is Not Public

This summary does not expose schemas, queue names, retry thresholds,
provider credentials, production data, internal dashboards, or worker
logs. Those are private implementation details.
