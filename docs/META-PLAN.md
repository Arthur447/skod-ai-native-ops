# META-PLAN — Top-down vision cascade for Skod

> **Purpose.** This document is the living tracker of Skod's top-down
> vision cascade — from Mission / Vision (level 1) to Execution (level
> 7). Its job is to keep the structure coherent as the business evolves,
> and to prevent the "we have strong operational docs but no articulated
> business vision" inversion Skod had until session 7 (2026-04-18).

## The 7-level cascade

| Level | Question it answers | Artefact | Status |
|---|---|---|---|
| **1. Vision** | Why does Skod exist? What does success look like at 3 years? | [`docs/VISION.md`](VISION.md) | ✅ Drafted (session 8, 2026-04-18) |
| **2. Strategy** | How do we get there? AI-native why? Business model? | `docs/STRATEGY.md` | ❌ Missing (session 9 target) |
| **3. Operating Model** | How do we run day-to-day? Roles, gates, principles | [`docs/HOW-WE-OPERATE.md`](HOW-WE-OPERATE.md) | ✅ Drafted |
| **4. Architecture** | What technical system carries the operating model? | [`docs/architecture/ai-native-operations.md`](architecture/ai-native-operations.md) + [`docs/adr/`](adr/) | ✅ Drafted (ADRs 0001, 0006, 0007) |
| **5. Roadmap** | In what order do we execute? | [`docs/ROADMAP-ai-native-organization.md`](ROADMAP-ai-native-organization.md) | ✅ Drafted (P1–P14) |
| **6. Backlog** | What are the tickets? | [`docs/backlog/`](backlog/) + GitHub Issues | 🟡 LP Optimizer chantier detailed, SKD-1003 executed, P10 backlog pending |
| **7. Execution** | Code, tests, deploy | `git log`, PRs, deployments | ✅ Continuous (PR #913, CI live) |

## Cascade integrity

Every level must trace **up** to the level above. When a roadmap
priority (level 5) is written, a reviewer should be able to ask *"which
strategy objective does this serve?"* and get a clean answer. Same for
architecture → operating model → strategy → vision.

Until session 7 we shipped bottom-up (levels 3-7 first, levels 1-2
deferred). The META-PLAN job is to **close the top gap** then
**verify trace-up** of everything below.

**Trace-up audit (session 10 target)** will re-read ROADMAP and ADRs
through the lens of Vision/Strategy and adjust where necessary — not a
rewrite, a coherence pass.

## Session log

| Date | Session | Outcome | Commits |
|---|---|---|---|
| **2026-04-17** | 1–6 | Bottom-up buildup: R&D enforcement tooling (dep-cruiser, jscpd, MCP), operating model, roadmap, ADR 0001, SKD-1003 executed end-to-end, CI live (GitHub Actions, path-filtered). | Multiple, visible on `feat/ai-native-operations` |
| **2026-04-17** | 6.5 | Strategic shift acted: Skod repositioned as a 360° AI-native organization asset, not only an interview-prep artefact. ADRs 0006 and 0007 drafted. Roadmap extended with P9–P14. | `b42d2c01`, `8bb4d16e`, `7611fba9` |
| **2026-04-18** | 7 (this commit) | META-PLAN tracker created. Top-down cascade formalized. Levels 1 and 2 identified as next priorities. | (this commit) |
| **2026-04-18** | 8 | Vision drafted via 6-question dialogue. Core positioning crystallized as *"the Calendly for paid email responses"*. Scale ambition declared: 1,000 active pros, ~€15k MRR at 3 years, capital-efficient micro-SaaS. Exclusions fixed: not a marketplace, not a Gmail replacement, not video/calls (legacy types to be cleaned), not B2C generic, France-first, not a content platform. Target: [`docs/VISION.md`](VISION.md) shipped. | (this commit) |
| **2026-04-??** | 9 — upcoming | Strategy drafting. Target: `docs/STRATEGY.md`. | pending |
| **2026-04-??** | 10 — upcoming | Cascade trace-up audit. Read roadmap + ADRs against Vision/Strategy; adjust where needed. | pending |

## Update protocol

Every session where top-down work happens updates this document:

1. **Flip any status that changed** in the cascade table
   (❌ → 🟡 → ✅).
2. **Append a session entry** to the log above with date, outcome,
   and referenced commits.
3. **Add new levels / artefacts** to the cascade table if the
   structure grew.

The META-PLAN is not a roadmap replacement — it sits **above** the
roadmap. The roadmap tells you *"what chantier to do next"*. The
META-PLAN tells you *"which level of the vision cascade is currently
the bottleneck, and whose gap to close first"*.

## See also

- [`docs/HOW-WE-OPERATE.md`](HOW-WE-OPERATE.md) — operating model (L3)
- [`docs/architecture/ai-native-operations.md`](architecture/ai-native-operations.md) — system architecture (L4)
- [`docs/ROADMAP-ai-native-organization.md`](ROADMAP-ai-native-organization.md) — roadmap (L5)
- [`docs/adr/`](adr/) — Architecture Decision Records
- [`docs/backlog/`](backlog/) — chantier-level backlogs
