# Skod — Strategy

> Level 2 of the [vision cascade](META-PLAN.md). Parent:
> [VISION.md](VISION.md). Every priority in
> [ROADMAP-ai-native-organization.md](ROADMAP-ai-native-organization.md)
> must trace UP to a strategy element defined in this document.

## Strategic posture — C-primary, Build first, Product later

**Mode principal** : Skod is operated primarily as a **professional
asset maximizing optionality**, not as a pure business nor as a pure
job-search credential. The public operating-model repo
([github.com/Arthur447/skod-ai-native-ops](https://github.com/Arthur447/skod-ai-native-ops))
is the artefact; the private product monorepo is the business.

**Moat** :
- **Primary (now)** — the BUILD. Speed of iteration, quality of
  operating model, agent orchestration discipline, git-log narrative.
  Visible to a serious reviewer (CTO, VP Eng, founder, fund) in 15
  minutes of repo navigation.
- **Secondary (post-PMF)** — the PRODUCT. AI features embedded in
  Skod itself (auto-draft of responses, smart pricing, LP Optimizer
  agent). Cheap to build post-PMF because the agent infrastructure
  is already in place.

**Pitch-phrase for interviews and LinkedIn** :

> *"Le moat de Skod aujourd'hui, c'est comment je construis — opérant
> comme une équipe de 10 avec des agents supervisés et tout le process
> visible dans le git log. Les features IA dans le produit arrivent
> après PMF, cheap à ajouter parce que l'infrastructure agent est déjà
> là."*

## The hedge structure (the elegant part)

Every scenario leads to a professional win. This is a call option on
Arthur's career with structurally-protected downside:

| Scenario | Outcome |
|---|---|
| Skod hits PMF organically | Bascule A-primary (bootstrap) or B-primary (venture) depending on signal |
| Seed fund proposes capital | Bascule B-primary (full venture mode) |
| CDI top poste signed early | Skod becomes side-asset, reduced cadence |
| Skod does not PMF in 12 months | CDI found via Skod experience as credential — *"Skod failing" does not exist, it just becomes a stronger hiring signal* |

**Key insight**: the longer Skod runs without PMF, the more the asset
improves, the easier the CDI hunt becomes. Time is an ally, not an
enemy. This is the opposite of a typical bootstrap-or-die startup.

## Investment level (6-month horizon)

| Variable | Value |
|---|---|
| Time dedicated | Full-time |
| Monthly budget (ads + API + tools) | ~€500 |
| Success signal at 6 months | **5 active users** (symbolic — the real success is the asset, not the user count) |
| Decoupling trigger | CDI top poste signed (no fixed month deadline) |
| Hedge | Stay full-time until CDI signed; extended time on Skod = improved asset = easier CDI |

## The moat in detail

### Primary — BUILD

What a serious reviewer sees when they open the public repo:

- **7-level top-down cascade** (META-PLAN) making the whole system
  coherent and navigable
- **Vision + Strategy + Operating Model + Architecture + ADRs +
  Roadmap + Backlog + Executed workflow** — all artefacts, all
  versioned, all maintained
- **SKD-1003 execution log** showing one ticket shipped end-to-end
  through the AI-native workflow (planner → human validation →
  architect consultation → coder → reviewer → merge)
- **CI enforcement** (dep-cruiser + jscpd + tests) with
  path-filtered monorepo triggering — not a config dumped, an
  operational pattern
- **MCP server with prototype-then-refactor** documented (inline PHP
  → drush commands custom module) — iteration discipline made
  visible
- **ADR series** (0001 LP Optimizer, 0006 360° principles, 0007 LPM
  architecture) with alternatives considered and rejected, not just
  decisions recorded

The reviewer's takeaway after 15 minutes: *"This person operates, at
solo scale, like a VP Eng at a 10-person AI-native scaleup."*

### Secondary — PRODUCT (deferred to post-PMF)

Not a priority now. Pre-positioned features for year 2+:

- Auto-draft responses via agent (recipient gets a pre-filled reply
  to edit in 10 seconds)
- Smart pricing suggestions based on sender profile and message
  content
- LP Optimizer agent (already partly built in PR #913)
- Human concierge + AI pre-filled responses as premium tier

Cost to add these features in year 2+: **low**, because the agent
infrastructure, MCP servers, and prompt-as-code layout are already in
place. A year-2 competitor without this foundation would need 6-12
months to catch up.

## Feedback loop

- **Cadence** — monthly review (first day of each month) of the
  META-PLAN and this document. Automated via GitHub Action on the
  public repo; see
  [`.github/workflows/monthly-strategy-review.yml`](../.github/workflows/monthly-strategy-review.yml).
- **Sparring partner** — Claude Code, via the AI-native operating
  model itself. Meta-level dogfooding: the operating model's tooling
  is used to review the operating model.
- **Metrics** — deferred to roadmap P6 (agent KPI instrumentation).
  Until P6 ships, reviews are qualitative.
- **Alarm signal** — *"interviewer challenges my AI-native
  positioning and I cannot defend it"*. If this happens, strategy
  review is triggered mid-cycle, not deferred to month-end.

## Risks and mitigations

| # | Risk | Severity | Mitigation / position |
|---|---|:---:|---|
| **R1** | Burnout (full-time solo, slow business feedback) | Low (self-assessed) | Passion + conviction on AI bet. Revisit in monthly reviews. |
| **R2** | Build moat erodes as AI-native becomes table-stakes | **Reframed** | First-mover advantage: in 12 months, those who did not start now will be behind. The well-documented first-mover becomes a teacher, not commodity. |
| **R3** | Public repo remains invisible (no reviewer engagement) | **Real — acknowledged** | Phased mitigation: solid implementation first, public posts (LinkedIn) once Arthur feels legitimate. **Cognitive trap warning**: legitimacy threshold is internal; at 3-month mark, if repo is objectively solid but engagement is zero, publish without waiting for the "feel" to catch up. |
| **R4** | Platform dependency (Claude, Anthropic, GitHub) | Low probability | Agent infrastructure abstractions are portable (`AiProviderBridge`, MCP as standard). Migration would be non-trivial but feasible. Accepted. |
| **R5** | Product drift vs. positioning (legacy consultation types vs. "paid message only") | Real, actively mitigated | Scheduled cleanup chantier (SKD-4001 planned — removal of `appel`, `visioconference`, `webinar`, `projet`, `produit_digital` types). |

## What this strategy requires operationally

- **Public repo maintained** as a living artefact (not a snapshot)
- **Monthly review discipline** — strategy does not rot between reviews
- **Implementation quality > volume** — five excellent chantiers beat
  fifteen half-done ones for C-primary
- **Git-log narrative discipline** — every chantier's execution
  visible phase by phase, not squashed into faceless commits
- **One chantier at a time** (roadmap rule) — continuous attention
  wins over multitasked mediocrity

## Open questions for next monthly review

- **R3 visibility** — at the 3-month mark (mid-July 2026), the repo
  will be objectively solid. Will Arthur still feel "not legitimate"?
  If yes, publish anyway. Set the trigger explicitly here.
- **Metrics** — does the absence of hard KPIs (pre-P6) hurt decision
  quality? If yes, accelerate P6.
- **PMF signal** — at 3 months we should have 1-2 active users minimum
  if C-primary is working. If zero, something is wrong in the funnel
  or the positioning.

## See also

- [`docs/META-PLAN.md`](META-PLAN.md) — the cascade tracker (level 0)
- [`docs/VISION.md`](VISION.md) — what success looks like (level 1)
- [`docs/HOW-WE-OPERATE.md`](HOW-WE-OPERATE.md) — operating model (level 3)
- [`docs/ROADMAP-ai-native-organization.md`](ROADMAP-ai-native-organization.md) — execution plan (level 5)
