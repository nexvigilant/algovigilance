# Algovigilance Gap Analysis

Gaps identified during project scaffolding. Each gap blocks a phase of the Yellow Brick Road.

## Phase 1 Gaps: TAR THE SCALE

### GAP-001: Scoring Weight Formula

**What:** No formula exists to score algovigilance signals by severity/weight.

**PV reference:** PV uses PRR, ROR, IC, EBGM for disproportionality (source: nexcore-pv-core signal detection). Algovigilance needs analogs.

**Candidates** [all unverified]:
| Candidate | Formula Shape | Measures |
|-----------|--------------|----------|
| Drift PRR | `P(drift\|model) / P(drift\|fleet)` | Is this model drifting more than peers? |
| Bias ROR | `odds(bias\|subgroup) / odds(bias\|population)` | Is bias disproportionate in a subgroup? |
| Hallucination IC | `log2(observed/expected)` | Are hallucinations more frequent than baseline? |
| Alignment EBGM | Empirical Bayes geometric mean of reward divergence | Shrinkage-adjusted alignment score |

**Blocked by:** No training data to validate against. Need at least one AI pipeline to monitor.

**Resolves when:** One scoring formula is implemented and validated against synthetic data.

### GAP-002: Baseline Protocol

**What:** No protocol for establishing "time zero" measurements before monitoring begins.

**Open questions:**
- What statistics capture a distribution fingerprint? (mean, variance, quantiles, KL?)
- How frequently should baselines be refreshed?
- What constitutes a "retraining event" that triggers re-baselining?

**Resolves when:** A baseline capture function exists in `nexcore-algovigilance` that produces a serializable fingerprint.

### GAP-003: Energy Cost Model

**What:** No cost model for continuous monitoring via `nexcore-energy` (source: nexcore CLAUDE.md, Biological Crate System).

**Open questions:**
- What is the token/compute cost of a single drift check?
- How does cost scale with distribution dimensionality?
- Should energy budgets be per-model or fleet-wide?

**Resolves when:** Each monitoring operation has a measured energy cost and the cost is wired into `nexcore-energy`.

## Phase 2 Gaps: SET THE BOUNDARY

### GAP-004: SMM Integration

**What:** Scientific Method enforcement (source: smm MCP server, NVG-SMM-001) is not wired into algovigilance hypothesis testing.

**Resolves when:** Drift signals can be promoted to SMM investigations with phase tracking.

### ~~GAP-005: Microgram Decision Trees~~ RESOLVED

**Resolved:** 3 micrograms created and tested (30/30 tests pass). 1 chain definition (4/4 tests pass).

| Microgram | Tests | Inputs | Outputs |
|-----------|-------|--------|---------|
| `algo-drift-classify` | 10/10 | PSI, KS p-value, observation_days | drift_class (6 levels), severity (P1-P5/NONE), action |
| `algo-signal-to-action` | 10/10 | signal_type (drift/bias/hallucination/alignment), severity | action, notify, observer_visible, operator_action_required |
| `algo-bias-triage` | 10/10 | disparity_ratio, affected_population_pct, protected_attribute | triage_level (5 levels), action, review_deadline_days, observer_visible |

**Chain:** `algo-drift-response` (classify → route) — 4/4 tests pass, 75us total execution.

Source: `~/Projects/rsk-core/rsk/micrograms/algo-*.yaml`, `~/Projects/rsk-core/rsk/chains/algo-drift-response.yaml`

## Phase 3 Gaps: GLASS WALL

### GAP-006: Observer API

**What:** No read-only API exists for external users.

**Requirements:**
- Authentication (who is observing)
- Authorization (read-only enforced at API layer, not just UI)
- Rate limiting (prevent scraping)
- No mutation endpoints exposed

**Resolves when:** At least one GET endpoint returns live monitoring data with auth.

### GAP-007: Dashboard Pages

**What:** No Nucleus pages for algovigilance observation.

**Resolves when:** A page at `nucleus/algovigilance/` renders live drift data.

## Phase 4 Gaps: OPERATOR CONSOLE

### GAP-008: Configuration Audit Trail

**What:** Operator changes to thresholds and sensitivity must be logged.

**Resolves when:** Every configuration change is persisted with operator ID, timestamp, and previous value.
