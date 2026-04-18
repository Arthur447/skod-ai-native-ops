# Chantier — LP Optimizer & AI Agent infrastructure

This is the backlog decomposition of **PR #913** into AI-native tickets.

Each ticket is written to be **executable by an agent**, with:

- a **Gherkin acceptance criteria** section (agent-consumable spec)
- a **risk tier** (low / medium / high / critical) → determines gate depth
- a **budget** estimate (USD of Claude API spend) → tracked against actual
- a **tech lead owner** — the simulated role accountable, even though
  currently the VPE wears that hat too
- a **success KPI** — how we will know the ticket achieved its goal

Tickets are ordered by **dependency + value**. Agent-operator is the
default executor; humans gate at plan-validation and at merge (weight
depends on risk tier).

---

## SKD-1001 — Meta Ads spend trigger webhook receiver

- **Owner**: Tech Lead `lp_optimizer`
- **Risk tier**: medium (external input, auth-critical)
- **Estimated agent budget**: $2
- **Success KPI**: webhook accepts signed Meta payloads and rejects unsigned ones with 100% accuracy on the test corpus

```gherkin
Feature: Trigger LP optimization on ad spend milestone
  As the LP Optimizer pipeline
  I want to be woken up when a Meta Ads campaign hits a spend threshold
  So that I can start a new optimization run

  Scenario: Valid signed webhook triggers a run
    Given a Meta Ads webhook carrying campaign_id, spend_eur and signature
    And the signature verifies against META_APP_SECRET
    And spend_eur >= 20
    When the webhook POSTs to /api/lp-optimizer/trigger
    Then the router creates a new OptimizationRun row with status "pending"
    And returns 202 Accepted

  Scenario: Tampered signature is rejected
    Given a webhook with an invalid HMAC
    When the webhook POSTs to /api/lp-optimizer/trigger
    Then the router returns 401 Unauthorized
    And no OptimizationRun is created
```

**Review gates**: plan validation (human) → CI (dep-cruiser, tests) → dev review on merge.

---

## SKD-1002 — GA4 behavioral metrics collector

- **Owner**: Tech Lead `lp_optimizer`
- **Risk tier**: low (read-only external call, no mutation)
- **Estimated agent budget**: $3
- **Success KPI**: for any given campaign over the last 24h, return the five metrics (scroll depth median, bounce rate, CTA click rate, session duration p50, pageviews) with a single GA4 API call

```gherkin
Feature: Collect behavioral metrics from GA4 for diagnosis
  As the diagnostic stage
  I want a single function that returns the last-24h behavior profile
  So that I can feed deterministic rules without knowing GA4 internals

  Scenario: Metrics available for the last 24h
    Given a GA4 property configured via GA4_PROPERTY_ID
    And a campaign that had pageviews in the last 24 hours
    When I call collect_behavior_profile(campaign_id)
    Then I receive a BehaviorProfile with the five metrics populated
    And no metric is null

  Scenario: Campaign without traffic
    Given a campaign that had zero pageviews in the last 24 hours
    When I call collect_behavior_profile(campaign_id)
    Then I receive a BehaviorProfile flagged as insufficient_data
    And the diagnostic stage exits cleanly without generating a variant
```

**Review gates**: plan validation → CI → dev review. Low risk, light review.

---

## SKD-1003 — Deterministic diagnostic rules + LLM enrichment

- **Owner**: Tech Lead `lp_optimizer`
- **Risk tier**: medium (shapes what the generator does next; errors here propagate)
- **Estimated agent budget**: $8 (LLM enrichment consumes tokens)
- **Success KPI**: diagnostic emits a top-3 prioritized issue list. Human reviewer agrees with ≥ 80% of priority-1 issues on a sample of 10 historical campaigns.

```gherkin
Feature: Diagnose landing page underperformance
  As the LP Optimizer pipeline
  I want a diagnostic that combines deterministic thresholds with LLM judgment
  So that we get both fast rule-based signal and nuanced interpretation

  Scenario: Bounce rate above threshold fires a deterministic rule
    Given a BehaviorProfile with bounce_rate > 0.75
    When I call diagnose(profile)
    Then the Diagnostic includes an issue of type "excessive_bounce"
    And the severity is at least "medium"

  Scenario: LLM enrichment adds qualitative context
    Given a BehaviorProfile with mixed signals
    When I call diagnose(profile)
    Then deterministic rules run first
    And LLM enrichment runs after and produces a hypothesis paragraph
    And LLM output is strictly additive — never overrides deterministic rules
```

**Review gates**: plan validation → CI → **tech lead review required** on the LLM enrichment path (prompt and output shape).

---

## SKD-1004 — Variant generator with single-section replacement

- **Owner**: AI Platform Engineer
- **Risk tier**: high (the actual content that may go live)
- **Estimated agent budget**: $15 (Claude completions for HTML generation)
- **Success KPI**: generated variants pass HTML validation, respect site layout constraints, and no variant contains external script/link injection on a corpus of 20 generated samples.

```gherkin
Feature: Generate a landing variant targeting a specific issue
  As the LP Optimizer pipeline
  I want to produce an HTML variant that replaces exactly one section
  So that the change is minimal, reviewable and reversible

  Scenario: Targeted generation for a priority-1 issue
    Given a Diagnostic with a priority-1 issue of type "weak_headline"
    When I call generate_variant(diagnostic, base_html)
    Then I receive an HTML variant
    And exactly one section is different from base_html
    And the diff is structural (semantic tags), not just textual

  Scenario: Generated HTML must not contain external injections
    Given any generated variant
    When the variant is validated
    Then it contains no <script src="...">
    And it contains no <link rel="..."> pointing outside the LP root
```

**Review gates**: plan validation → CI → **AI Platform Engineer review** on prompt changes → **Tech lead review** on variant validation rules.

---

## SKD-1005 — Persistence with HMAC-signed callback URLs

- **Owner**: Tech Lead `lp_optimizer`
- **Risk tier**: high (auth boundary for the approval flow)
- **Estimated agent budget**: $4
- **Success KPI**: 100% of replayed callback URLs are rejected past TTL; 100% of tampered URLs return 401.

```gherkin
Feature: Persist optimization runs with signed callback URLs
  As the approval flow
  I want URLs that are impossible to forge and expire quickly
  So that only the legitimate Slack user can approve/reject

  Scenario: Fresh signed URL within TTL
    Given an OptimizationRun was persisted with callback_secret
    And the URL was generated less than 15 minutes ago
    When the callback URL is POSTed
    Then the signature verifies
    And the run status transitions to the action taken

  Scenario: Tampered URL is rejected
    Given an OptimizationRun URL with a modified signature
    When the callback URL is POSTed
    Then the handler returns 401
    And the run status is unchanged

  Scenario: Expired URL is rejected
    Given an OptimizationRun URL generated 16 minutes ago with TTL=15m
    When the callback URL is POSTed
    Then the handler returns 410 Gone
    And the run status is unchanged
```

**Review gates**: plan validation → CI → **Quality Engineer review** (security-critical).

---

## SKD-1006 — Slack HITL notification with approve/reject/preview

- **Owner**: Tech Lead `lp_optimizer`
- **Risk tier**: medium (public-facing action originates here)
- **Estimated agent budget**: $3
- **Success KPI**: approver receives a Slack message within 30 seconds of variant generation; all three actions (approve, reject, preview) work end-to-end.

```gherkin
Feature: Human-in-the-Loop approval via Slack
  As the Product Ops approver
  I want a Slack message with the variant summary and three buttons
  So that I can approve, reject or preview in one click

  Scenario: New variant ready generates Slack message
    Given a new variant was persisted in status "awaiting_approval"
    When notifier.notify_ready(run_id) is called
    Then a Slack message is posted to SLACK_WEBHOOK_URL
    And the message contains the run id, summary, three action URLs
    And each URL is HMAC-signed with unique action payload

  Scenario: Approver clicks "approve"
    Given a Slack-triggered approval callback
    When the callback verifies
    Then the run status transitions to "approved"
    And the deployer is invoked
    And a confirmation Slack message is posted
```

**Review gates**: plan validation → CI → dev review on merge.

---

## SKD-1007 — Atomic variant deployment via tempfile-then-rename

- **Owner**: Tech Lead `lp_optimizer`
- **Risk tier**: critical (live traffic impact, irreversible in the production sense)
- **Estimated agent budget**: $2
- **Success KPI**: no partial write observed over 50 test deployments; rollback from variant N to N-1 completes in < 1 second; never invoked outside the approval callback path.

```gherkin
Feature: Atomically swap the active LP variant
  As the deployer
  I want the swap to be atomic at the filesystem level
  So that a concurrent request never observes a half-written state

  Scenario: Successful approval triggers atomic swap
    Given an approved OptimizationRun with variant lp_v3.html
    When deployer.activate(run_id) is called
    Then a new lp_config.json is written to a tempfile in the same dir
    And the tempfile is renamed (atomic on POSIX) to lp_config.json
    And the feature flag points at lp_v3

  Scenario: Deployer refuses to run without explicit approval
    Given an OptimizationRun in status "generated" (not approved)
    When deployer.activate(run_id) is called
    Then it raises DeployerRefusedError
    And lp_config.json is unchanged
```

**Review gates**: plan validation → CI → **tech lead review required** → **VPE review required** (critical risk tier) → progressive rollout is not applicable (atomic swap) but the first production activation must be observed live by a human.

---

## Budget & KPI rollup

| Ticket | Risk | Budget $ | Cumulative |
|---|---|---:|---:|
| SKD-1001 Meta webhook | medium | 2 | 2 |
| SKD-1002 GA4 collector | low | 3 | 5 |
| SKD-1003 Diagnostic | medium | 8 | 13 |
| SKD-1004 Generator | high | 15 | 28 |
| SKD-1005 Persistence + HMAC | high | 4 | 32 |
| SKD-1006 Slack HITL | medium | 3 | 35 |
| SKD-1007 Atomic deployer | critical | 2 | 37 |

**Total chantier budget**: ~$37 of Claude API spend for the LP Optimizer
loop. This is an order-of-magnitude estimate for plan + code + review
agent calls; actual will be tracked and compared.

**Business KPI for the chantier**: within 4 weeks of first run, we expect
a ≥ 10% improvement in Meta Ads funnel conversion (click → signup) on the
best-performing variant vs. the v1 baseline. Failure mode: no variant
beats v1 → the diagnostic rules or the generator prompts need review
(triggers ADR 0002 on eval harness).

## Review gate summary

| Risk tier | Plan validation | CI | Dev review | Tech lead | VPE | Progressive rollout |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| low | ✓ | ✓ | light | — | — | — |
| medium | ✓ | ✓ | ✓ | — | — | — |
| high | ✓ | ✓ | ✓ | ✓ | — | feature flag |
| critical | ✓ | ✓ | ✓ | ✓ | ✓ | observed first run |
