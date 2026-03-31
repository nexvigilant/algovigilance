# Scoring Candidates: PV-to-Algo Signal Weight Transfer

How to weigh algovigilance signals. Each candidate transfers a PV scoring method to the algorithmic domain.

## Transfer Rationale

PV signal detection has 30+ years of validated methodology (source: nexcore-pv-core, ICH E2E guidelines via ich_org MCP tools). Algorithmic vigilance faces the same fundamental problem: detecting unexpected patterns in large-scale observational data. The T1 primitive grounding is identical: κ(Comparison) + N(Quantity) + ν(Frequency).

## Candidate Scoring Functions

All formulas below are [unverified] — proposed transfers requiring validation against synthetic or real AI monitoring data.

### 1. Algorithmic PRR (Proportional Reporting Ratio)

**PV original:** `PRR = (a / (a+b)) / (c / (c+d))` where a=drug-event, b=drug-no-event, c=no-drug-event, d=no-drug-no-event (source: nexcore-pv-core PRR implementation).

**Algo transfer:**
```
a = count(drift events in model X)
b = count(non-drift checks in model X)
c = count(drift events in all other models)
d = count(non-drift checks in all other models)

Algo-PRR = (a / (a+b)) / (c / (c+d))
```

**Interpretation:** Is model X drifting disproportionately compared to the fleet?

**Signal threshold** [unverified]: Algo-PRR >= 2.0 AND a >= 3 (borrowing Evans' criteria from PV).

### 2. Algorithmic ROR (Reporting Odds Ratio)

**PV original:** `ROR = (a*d) / (b*c)` — same 2x2 table (source: nexcore-pv-core ROR implementation).

**Algo transfer:**
```
a = bias events in subgroup S
b = non-bias checks in subgroup S
c = bias events in complement of S
d = non-bias checks in complement of S

Algo-ROR = (a*d) / (b*c)
```

**Interpretation:** Is bias disproportionate in a protected subgroup?

### 3. Algorithmic IC (Information Component)

**PV original:** `IC = log2(observed / expected)` with shrinkage (source: nexcore-pv-core IC/IC025 implementation).

**Algo transfer:**
```
observed = actual hallucination count for query class Q
expected = baseline hallucination rate * total queries in class Q

Algo-IC = log2(observed / expected)
```

**Interpretation:** Are hallucinations unexpectedly frequent for this query type?

**Signal threshold** [unverified]: IC025 > 0 (lower bound of 95% CI above zero, matching WHO-UMC methodology).

### 4. Decay-Adjusted Triage (Already Exists)

The `nexcore-algovigilance` triage module already implements exponential decay with reinforcement (source: `nexcore-algovigilance/src/triage/`). This gives signals a half-life — old signals fade unless reinforced by new evidence.

**Integration:** Scoring functions (1-3 above) produce raw signal strength. Decay-adjusted triage determines current relevance. Combined: `weight = raw_score * decay_factor`.

## Validation Plan [unverified]

1. Generate synthetic monitoring data with known injected drift/bias
2. Compute each scoring function
3. Measure sensitivity (does it catch the injected signal?) and specificity (does it avoid false alarms?)
4. Compare against PV gold-standard thresholds
5. Calibrate thresholds for algorithmic domain

## Open: What Makes a Signal Heavy?

Weight = severity * urgency * breadth.

| Factor | Measures | Scale |
|--------|----------|-------|
| Severity | How far from baseline? | Continuous (standard deviations) |
| Urgency | How fast is it changing? | Velocity (drift rate per time window) |
| Breadth | How many users/queries affected? | Count or proportion |

Combined weight formula: TBD. This is GAP-001 from `docs/gaps.md`.
