# Architecture Summaries

This section contains public-safe architecture summaries for the Skod V2
transformation lab. It explains the patterns without exposing private
source code, infrastructure details, secrets, customer data, internal
logs, or raw prompts.

## Public Pages

| Page | What it shows |
|---|---|
| [Durable jobs and outbox](durable-jobs-outbox.md) | How durable async handoff supports delivery control and operational recovery. |
| [Email flow](email-flow.md) | How provider boundaries and inbound replies are treated as platform capabilities. |
| [AI-native operations](ai-native-operations.md) | How AI-assisted work fits into delivery governance. |

## Why This Matters

Modernization work fails when architecture exists only in code or tribal
knowledge. These summaries make the operating choices readable to
recruiters, CTOs, CPTOs, and transformation leads without publishing
private implementation detail.

## Not Public

The public architecture docs intentionally exclude module internals,
database schemas, deployment details, credentials, customer data,
private product workflows, and low-level execution logs.
