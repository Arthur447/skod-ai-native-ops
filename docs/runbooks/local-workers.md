# Local Workers

## Pattern

Worker processes handle asynchronous jobs outside the request path. In
the public lab, the important pattern is not the exact command line. It
is the operating distinction between synchronous product flows and
durable background processing.

## Why It Matters

Workers make modernization work more governable:

- async work can be retried without repeating the user request;
- delivery failures have an operational owner;
- background processing can be observed separately from web traffic;
- small PRs can change worker behavior behind clear acceptance
  criteria.

This supports delivery acceleration with control because side effects
are visible and reviewable.

## What Is Not Public

Private worker commands, environment variables, queue names,
credentials, production topology, and logs are intentionally omitted.
