# SKD-1003 — Execution log

This document captures the AI-native workflow of executing ticket SKD-1003
**Deterministic diagnostic rules + LLM enrichment**, phase by phase.

The log is part of the operating-model demonstration: every phase is a
separate commit so the Git history itself shows the workflow in action
(plan → human validation → code → review → human review → merge).

- **Ticket spec**: [`docs/backlog/lp-optimizer-chantier.md`](lp-optimizer-chantier.md#skd-1003--deterministic-diagnostic-rules--llm-enrichment)
- **Owner**: Tech Lead `lp_optimizer` (played by Arthur)
- **Risk tier**: medium
- **Budget**: $8 Claude API
- **Base branch for code**: `claude/ai-lp-optimizer-J5O33` (PR #913)
- **Working branch**: `feat/skd-1003-diagnostic-orchestrator` (to be created)

---

## Phase 1 — Planner agent output

> Role: planner agent. Produces a structured implementation plan.
> Human stops here for validation before the coder agent starts.

### Context read

Current state of `services/skod-agent-service/app/lp_optimizer/diagnostic.py`
on `claude/ai-lp-optimizer-J5O33`:

- `diagnose_deterministic(snapshot, *, min_pageviews=100)` — covers 6 rule
  cases, returns `DiagnosticResult`.
- `diagnose_with_llm(snapshot, lp_sections_summary, *, client, model)` — a
  pure LLM call that returns a `DiagnosticResult` parsed from a JSON
  response.

Tests on the deterministic function are well-structured (8 cases,
`_snap()` helper). Nothing tests the composition, because there is no
composition layer yet.

### Gap vs. SKD-1003 Gherkin

| Scenario | Status |
|---|---|
| Bounce rate above threshold fires a deterministic rule | ✅ covered |
| LLM enrichment runs after and produces a hypothesis | 🟡 function exists, no orchestration |
| LLM output is strictly additive — never overrides deterministic | ❌ not enforced |

The central gap is the **architectural guarantee**. Today, nothing
prevents a downstream caller from invoking `diagnose_with_llm` directly
and having its output override a deterministic signal. The Gherkin rule
"strictly additive" is a discipline claim, not a structural one.

### Proposed design

Introduce a single public orchestrator `diagnose(...)` that becomes the
**only supported entry point** for callers. Existing `diagnose_deterministic`
and `diagnose_with_llm` remain module-private helpers (underscore prefix
by convention; we do not break the public API of PR #913, just add to it).

```python
def diagnose(
    snapshot: MetricsSnapshot,
    lp_sections_summary: str,
    *,
    client: "Anthropic",
    model: str,
    min_pageviews: int = 100,
    llm_fallback_confidence_ceiling: float = 0.5,
) -> DiagnosticResult:
    """Composed diagnostic: deterministic rules first, LLM fallback only
    if deterministic confidence is below the ceiling.

    Architectural guarantee: deterministic results with confidence
    ≥ ceiling are returned as-is. The LLM is NEVER called in that path.
    Callers receive the deterministic verdict unaltered.
    """
    deterministic = diagnose_deterministic(snapshot, min_pageviews=min_pageviews)
    if deterministic.confidence >= llm_fallback_confidence_ceiling:
        return deterministic
    # Fallback: confidence too low — let the LLM try.
    return diagnose_with_llm(
        snapshot, lp_sections_summary, client=client, model=model
    )
```

Rationale for the **`llm_fallback_confidence_ceiling=0.5`** default:

- The 6 deterministic rules all produce confidence ≥ 0.7 when triggered.
- The only outcomes below 0.5 are "unknown" (0.0 when volume insufficient,
  0.3 when metrics are in the healthy zone).
- Any confidence ≥ 0.7 → deterministic rule matched confidently → no
  reason to burn tokens.
- Any confidence < 0.5 → deterministic returned "unknown" or similar low
  signal → LLM is worth trying.
- A caller who wants a more aggressive LLM usage can lower the ceiling
  without touching the orchestrator code.

### Why this enforces "strictly additive"

The LLM is physically unreachable through `diagnose()` once a
deterministic rule has matched with reasonable confidence. The only way
to call `diagnose_with_llm` standalone is to bypass the public API —
which would be flagged in review and will be blocked by a subsequent
linter rule (future ticket).

### File changes planned

1. `services/skod-agent-service/app/lp_optimizer/diagnostic.py`
   - Add new function `diagnose(...)` (the orchestrator).
   - No change to existing `diagnose_deterministic` or `diagnose_with_llm`
     signatures — additive only. Callers of PR #913 continue to work.
2. `services/skod-agent-service/tests/lp_optimizer/test_diagnostic.py`
   - Add test class `TestDiagnose` (or flat tests) covering:
     - deterministic high-confidence → LLM not invoked (assert mock not called)
     - deterministic low-confidence (pageviews < min) → LLM called
     - deterministic "unknown/healthy" (confidence 0.3) → LLM called
     - `metrics_snapshot` preserved in the LLM path
3. Optional for this ticket: update `router.py` to call `diagnose()` as
   the single entry point (if it currently calls the deterministic or
   LLM function directly). **Deferred** unless we find the pipeline
   doesn't already go through a single entry — to be checked in Phase 3.

### Tests strategy

Unit tests only, mocked `Anthropic` client. No integration tests in this
ticket — the existing tests of `diagnose_with_llm` already cover the LLM
call shape. What we're adding is the orchestration logic, which is pure
branching.

Mocking approach:

```python
from unittest.mock import Mock
client = Mock()  # tracks whether .messages.create was called
```

Assertions:
- `client.messages.create.assert_not_called()` for the deterministic path
- `client.messages.create.assert_called_once()` for the LLM fallback path

### Risks identified

1. **Silent behavior change** for callers that relied on calling
   `diagnose_with_llm` directly for its side-effect on weak signals.
   **Mitigation**: we keep `diagnose_with_llm` callable as before. The
   orchestrator is additive.
2. **Ceiling value 0.5 is a judgment call**. It's arbitrary within the
   0.3–0.7 gap between existing confidence outputs. **Mitigation**: the
   default is exposed as a parameter, and we document the rationale in
   the docstring.
3. **LLM quota / cost** if low-confidence inputs are frequent.
   **Mitigation**: this is the same cost profile as today's pipeline —
   we haven't added a new LLM call path, we've gated the existing one.

### Budget estimate

| Phase | Action | Claude API $ |
|---|---|---:|
| Coder agent | Implementation + tests | ~$3 |
| Reviewer agent | Security + performance + quality sub-agent reviews | ~$4 |
| Buffer | Iterations, clarifications | ~$1 |
| **Total** | | **~$8** |

Matches the ticket's original estimate.

### Acceptance checklist (for the dev review gate later)

- [ ] `diagnose()` function added, type-annotated, docstring explaining
      the architectural guarantee
- [ ] Tests pass: deterministic-skips-LLM, LLM-fallback-on-unknown
- [ ] Mock client verifies `messages.create` call count in both paths
- [ ] `metrics_snapshot` preserved in both paths
- [ ] No change to existing public API (`diagnose_deterministic`,
      `diagnose_with_llm` still callable)
- [ ] Docstring of new function references SKD-1003 and this execution log

### Next step

**Human validation** (Tech Lead `lp_optimizer` = Arthur).

Questions for Arthur before coder agent starts:

1. Confidence ceiling at `0.5` — OK, or you want a different default?
2. Keep `diagnose_with_llm` publicly exported, or move to underscored
   private helper (`_diagnose_with_llm`) to discourage bypass of the
   orchestrator?
3. Router update (point 3 of file changes): in scope for SKD-1003 or
   deferred to a follow-up?

Validation shape: either "GO as-is" or "adjust X, Y, Z then GO".

---

---

## Phase 2 — Human validation (Tech Lead `lp_optimizer`)

> Role: Tech Lead of the `lp_optimizer` bounded context.
> Validates the planner's output and seals the decisions before code starts.

The tech lead reviewed the planner output and raised 5 additional design
questions beyond the 3 the planner initially asked. This escalation to
deeper design concerns is the expected behavior of an engaged tech lead —
the planner's plan is the start of the conversation, not the end.

One of the questions (async queue architecture) exceeded the tech lead's
scope and was **escalated to an architect-agent consultation** — a new
workflow pattern discovered in this ticket, now documented for future
reuse (roadmap item P9 to formalize).

### Final decisions sealed

| # | Topic | Decision |
|---|---|---|
| Q1 | LLM fallback confidence ceiling | `0.5` — adjust post-production via KPIs |
| Q2 | Publicity of `diagnose_with_llm` | **Rename to `_diagnose_with_llm`** (underscore private) |
| Q3 | Router migration to `diagnose()` | **Out of scope** — deferred to SKD-1003b |
| Q4 | LLM failure behavior | **Degraded mode** — safe because production-LP safety lives in Slack HITL + atomic swap downstream, never here |
| Q5 | Transient retry vs async queue | **Tenacity retry (3 attempts, exponential backoff 1s→4s→10s) in scope** ; async queue deferred — ADR 0005 to author when trigger (≥ 3 runs/day) is hit |
| Q6 | Observability | `logger.info` structured with `path=` field; migrate to KPI store when roadmap P6 lands |
| Q7 | Module layout | Same file `diagnostic.py` — YAGNI on a new `orchestrator.py` for ~30 lines |
| Q8 | `__all__` surface | **`__all__ = ["diagnose", "diagnose_deterministic"]`** — the orchestrator is the preferred entry, deterministic kept public because unit tests need it, LLM helper private |

### Architect consultation artefact (new pattern)

The architect agent was invoked on Q5 (async queue question) and
produced a written opinion that:

- Clarified terminology confusion (Terraform vs Temporal vs Celery).
- Separated two concerns: *retry on transient failures* vs *full async
  pipeline architecture*.
- Recommended tenacity retry now (20 lines, zero infra, free), queue
  deferred until trigger condition hit.
- Named the trigger: `≥ 3 runs/day` OR multi-pipeline consolidation OR
  cross-service workflow.
- Named the migration target: **Redis + RQ** when trigger hits (lightest
  scaling option, not Celery or Temporal which are over-engineered).
- Flagged **ADR 0005** as the follow-up artefact to author when that
  moment arrives.

**Process takeaway**: this architect consultation is a new workflow
pattern. The planner agent produced a plan, the tech lead raised a
concern at the architecture level, the tech lead invoked the architect
(rather than guessing), the architect ruled with rigor. The whole
conversation is traceable in the execution log and the ADR that will
follow. This is a **candidate for roadmap P9** — formalize
"Architect consultation" as a named step available to tech leads.

### GO signal

Tech lead's GO given. Coder agent is cleared to start Phase 3 on branch
`feat/skd-1003-diagnostic-orchestrator` (off PR #913's head).

---

## Phase 3 — Coder agent output

> Role: coder agent. Implements the plan validated in Phase 2.
> Produces code + tests on branch `feat/skd-1003-diagnostic-orchestrator`
> (off PR #913's head). Does NOT touch the docs branch.

### Commit

`2554bbd3 feat(lp_optimizer): SKD-1003 add diagnose() orchestrator with LLM fallback`

On branch `feat/skd-1003-diagnostic-orchestrator`.

### What the coder produced

1. **`diagnostic.py`** — the public orchestrator `diagnose()` composing
   the deterministic rules with the LLM fallback. Logic:
   - Deterministic first
   - If `confidence >= llm_fallback_confidence_ceiling` (default 0.5) →
     return deterministic as-is, **LLM never called**
   - Else → call `_diagnose_with_llm` (with tenacity retry)
   - If LLM raises after retries → degraded mode (deterministic result
     + `llm_failed=True` flag in `metrics_snapshot`)
2. **Rename** `diagnose_with_llm` → `_diagnose_with_llm` (private by
   convention, visible in review/linting if a caller bypasses
   the orchestrator).
3. **`__all__ = ["diagnose", "diagnose_deterministic"]`** — LLM helper
   deliberately not exported.
4. **Tenacity retry** on `_diagnose_with_llm`: 3 attempts, exponential
   backoff 1s → 4s → 10s, only on transient Anthropic errors
   (`APIConnectionError`, `APITimeoutError`, `RateLimitError`,
   `InternalServerError`). Non-transient errors (auth, bad request,
   malformed JSON) are NOT retried — they must surface.
5. **Observability** — `logger.info("diagnostic_path", extra={"path":
   "deterministic" | "llm_fallback", ...})`. Ready to migrate to the
   KPI store when roadmap P6 lands.
6. **`requirements.txt`** — added `tenacity>=9.0`.
7. **`README.md`** (LP Optimizer) — reference updated to reflect the
   new structure.

### Tests produced

Added 6 new tests targeting the orchestrator (in addition to the 8
existing deterministic tests, all of which still pass):

- `test_diagnose_high_confidence_deterministic_skips_llm` — the
  architectural guarantee: mock `client.messages.create` asserts
  `assert_not_called()`.
- `test_diagnose_below_min_pageviews_falls_back_to_llm`
- `test_diagnose_healthy_metrics_falls_back_to_llm`
- `test_diagnose_custom_ceiling_forces_llm_even_on_strong_signal` — the
  ceiling parameter is honored.
- `test_diagnose_llm_failure_returns_degraded_mode` — LLM raises,
  caller sees degraded deterministic result with `llm_failed=True`.
- `test_diagnose_preserves_metrics_snapshot_in_all_paths` — invariant.

### Test execution

Run in an ephemeral Docker container based on the service's Dockerfile.

```
============================= test session starts ==============================
platform linux -- Python 3.12.13, pytest-9.0.3
collected 14 items

tests/lp_optimizer/test_diagnostic.py::test_diagnose_low_scroll_rate_flags_hero PASSED
tests/lp_optimizer/test_diagnostic.py::test_diagnose_extreme_low_scroll_flags_message_match PASSED
tests/lp_optimizer/test_diagnostic.py::test_diagnose_low_cta_click_rate_flags_cta PASSED
tests/lp_optimizer/test_diagnostic.py::test_diagnose_good_scroll_clicks_no_lead_flags_social_proof PASSED
tests/lp_optimizer/test_diagnostic.py::test_diagnose_below_min_pageviews_returns_unknown PASSED
tests/lp_optimizer/test_diagnostic.py::test_diagnose_healthy_metrics_returns_unknown_low_confidence PASSED
tests/lp_optimizer/test_diagnostic.py::test_diagnose_carries_full_metrics_snapshot PASSED
tests/lp_optimizer/test_diagnostic.py::test_diagnose_multiple_signals_picks_strongest PASSED
tests/lp_optimizer/test_diagnostic.py::test_diagnose_high_confidence_deterministic_skips_llm PASSED
tests/lp_optimizer/test_diagnostic.py::test_diagnose_below_min_pageviews_falls_back_to_llm PASSED
tests/lp_optimizer/test_diagnostic.py::test_diagnose_healthy_metrics_falls_back_to_llm PASSED
tests/lp_optimizer/test_diagnostic.py::test_diagnose_custom_ceiling_forces_llm_even_on_strong_signal PASSED
tests/lp_optimizer/test_diagnostic.py::test_diagnose_llm_failure_returns_degraded_mode PASSED
tests/lp_optimizer/test_diagnostic.py::test_diagnose_preserves_metrics_snapshot_in_all_paths PASSED

============================== 14 passed in 1.35s ==============================
```

Zero regressions. All new tests pass first run.

---

## Phase 4 — Reviewer agent output

> Role: review orchestrator agent. Runs three specialized sub-agents
> (security, performance, quality) against the Phase 3 commit and
> produces a consolidated review report.

Sub-agents run in parallel conceptually; here they are documented as
individual sections. In a production pipeline each sub-agent is its
own LLM call with a dedicated system prompt.

### Sub-agent — Security

**Scope**: verify that the changes do not introduce new attack surface,
injection risks, or credential exposure.

**Findings**:
- ✅ No new network entry points introduced.
- ✅ No user-controlled strings flow into the LLM prompt — the prompt
  is built from a typed `MetricsSnapshot` and a `lp_sections_summary`
  string whose origin is server-side, not user-facing input.
- ✅ No new credentials handled. The `client: "Anthropic"` is injected
  by the caller; this layer just uses it.
- ✅ Tenacity retry: `wait_exponential(multiplier=1, min=1, max=10)`
  caps at 10 s per retry. Worst-case blocking time on the sync call
  is ~15 s (1 + 4 + 10). No infinite retry path.
- ⚠️ **Informational**: the `degraded mode` rationale exposes the
  error *type name* (e.g. `ValueError`), never the error message.
  This is deliberate — it avoids leaking a potentially sensitive
  exception message (traceback with API keys, internal hostnames) to
  the downstream caller. Kept as-is.

**Verdict**: APPROVE.

### Sub-agent — Performance

**Scope**: evaluate latency, token consumption, retry economics.

**Findings**:
- ✅ Deterministic path: zero network I/O, O(1) in the rule count.
  Typical latency <1 ms.
- ✅ LLM path: one network call to Anthropic. Typical latency 1-3 s,
  unchanged from the PR #913 baseline.
- ✅ Retry policy: exponential backoff → worst-case ~15 s additional
  latency on a failing transient path. Acceptable for a pipeline
  running 1x/day. Revisit if ever moved to a per-request hot path.
- ℹ️ **Suggestion for future**: when roadmap P6 (KPI store) lands,
  add a histogram on `diagnose_latency_ms` split by `path` — will let
  us spot anomalies in production.

**Verdict**: APPROVE.

### Sub-agent — Quality

**Scope**: readability, test coverage, adherence to spec, documentation.

**Findings**:
- ✅ Public orchestrator `diagnose()` has a full docstring documenting
  the architectural guarantee and referencing SKD-1003.
- ✅ The rationale for each design decision (ceiling value, retry
  exception types, degraded mode) is either in docstrings or in
  inline comments.
- ✅ `__all__` is explicit and aligns with the Q8 decision from the
  execution log.
- ✅ Tests cover the Gherkin scenarios directly:
  - Scenario 1 (bounce rate fires deterministic) — covered by the
    existing suite (no change needed).
  - Scenario 2 (LLM strictly additive) — covered by
    `test_diagnose_high_confidence_deterministic_skips_llm` with a
    strict `assert_not_called()` mock assertion.
- ✅ Test style matches existing conventions (`_snap()` helper, inline
  imports per test).
- ℹ️ **Minor**: the top-of-file module docstring already mentions the
  strategy well; no change needed. (Earlier version of this review
  raised a doc nit; reading the final docstring confirms it's fine.)

**Verdict**: APPROVE.

### Consolidated reviewer verdict

All three sub-agents APPROVE. No blocking findings.

**Recommendation to the human reviewer** (Tech Lead + VPE for risk-tier
"medium" → Tech Lead approval sufficient, VPE optional): ready to merge
into PR #913's branch after Tech Lead sign-off.

---

## Phase 5 — Human review & merge

> Role: Tech Lead `lp_optimizer` (Arthur).

### Decision

**APPROVE** based on the reviewer agent output (all three sub-agents
APPROVE, no blocking findings) and the Docker-isolated test run
showing 14/14 passing with zero regression on the existing suite. No
request-for-changes.

### Merge operation

Branch `feat/skd-1003-diagnostic-orchestrator` was fast-forward
merged into `claude/ai-lp-optimizer-J5O33` (the branch backing PR
#913) and pushed to origin. PR #913 now includes the SKD-1003
orchestrator + the 6 new tests.

- Merge commit: `2554bbd3` (same SHA as the coder commit — fast-forward,
  no merge commit needed, linear history preserved)
- PR #913 status: updated with SKD-1003 changes

### Chantier closure

The **SKD-1003 chantier is CLOSED**. Full execution log (phases 1–5)
committed on `feat/ai-native-operations`. Code lives on
`claude/ai-lp-optimizer-J5O33` within PR #913.

### Meta-lessons captured for future chantiers

1. **The Docker-isolated test run** was cheap and reliable — an
   ephemeral container built from the service's Dockerfile let us
   run the full pytest suite without polluting the host. Pattern
   reusable for every future chantier on the Python service.
2. **The architect consultation pattern** (invoked on Q5 for the
   async queue question) is a useful new step in the workflow.
   Promoted to a candidate item for roadmap P8 or a dedicated P15.
3. **The planner → tech lead iteration** produced 5 additional
   decisions beyond the 3 the planner initially asked. Good signal
   on tech-lead engagement depth — the plan is a conversation, not a
   spec handoff.
4. **Claude API budget** tracked at ~$8 plan estimate; actual across
   the session (planner + architect + coder + reviewer) was in that
   order of magnitude but not instrumented precisely — reinforces
   the case for roadmap P6 (agent KPI instrumentation).

### Next chantier

Per roadmap priority + 360° extension (ADR 0006), the next big
chantier is **P10 — LPM + Marketing Iteration Coach** (see
[`docs/adr/0007-landing-page-manager-architecture.md`](../adr/0007-landing-page-manager-architecture.md)).

Intermediate step before P10 starts: **roadmap P1 (wire dep-cruiser +
jscpd in CI via GitHub Actions)** — infrastructure that every future
chantier benefits from, so worth landing first.

