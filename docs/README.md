# Skod V2 Docs

> Public documentation for the AI-native engineering transformation lab.

## Navigation

| Path | Purpose |
|---|---|
| [00-executive-summary.md](00-executive-summary.md) | Three-minute overview for recruiters, CTOs, CPTOs, and transformation leads. |
| [06-recruiter-demo-guide.md](06-recruiter-demo-guide.md) | Five-minute and fifteen-minute reading paths by role. |
| [case-studies/](case-studies/) | Recruiter-facing case studies on modernization and AI-assisted delivery governance. |
| [architecture/](architecture/) | Platform architecture, module map, request flow, durable jobs, email flow, and migration guides. |
| [runbooks/](runbooks/) | Operational playbooks for onboarding, release, observability, local workers, AI productivity, and risk. |
| [adr/](adr/) | Repository-scoped Architecture Decision Records. |
| [backlog/](backlog/) | Refonte ticket candidates derived from the V1 to V2 parity audit. |
| [feature-parity-audit.md](feature-parity-audit.md) | Human-readable parity audit. |
| [feature-parity-audit.yaml](feature-parity-audit.yaml) | Machine-readable parity audit used for planning. |

## How To Read This Repo

This docs tree is intentionally public and curated. It focuses on the
operating model behind a real modernization program:

- transformation engineering;
- AI-native delivery governance;
- human-in-the-loop review;
- modular platform modernization;
- observability and delivery predictability.

It does not publish confidential product source code, secrets, customer
data, private business detail, raw prompts, or low-level AI execution
logs.

## Decision Protocol

- **Architecture decision touching the V2 platform**: add or update an
  ADR in [adr/](adr/).
- **Operational change**: update the relevant runbook in
  [runbooks/](runbooks/).
- **Modernization evidence**: add a concise case study in
  [case-studies/](case-studies/) when a pattern is useful to external
  reviewers.
- **Delivery governance change**: update
  [runbooks/ai-team-productivity-loop.md](runbooks/ai-team-productivity-loop.md)
  or the relevant review/release guide.
