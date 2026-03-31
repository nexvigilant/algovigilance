# Algovigilance

**Vigilance of AI Training — Observe the Algorithm, Protect the Human**

## Mission

Apply pharmacovigilance discipline to AI training pipelines. The same rigor that monitors drug safety signals in post-market surveillance now monitors algorithmic behavior signals in post-deployment AI systems.

NexVigilant's mission is making pharmacovigilance accessible to intelligent beginners (source: ~/.claude/CLAUDE.md, Vision section). Algovigilance extends this: making **algorithmic safety monitoring** accessible — with the same "For NexVigilants" UX pattern of zero jargon, step-by-step wizards, and plain-English explanations.

## Vision

A world where AI training is as monitored as drug manufacturing. Where drift is detected like adverse events. Where bias is triaged like safety signals. Where humans can **observe** what algorithms learn — transparently, continuously, without interference.

## The Scale

Before you can weigh anything, you must tar the scale.

### What We Weigh

| Signal Type | PV Analog | Algovigilance Metric |
|-------------|-----------|---------------------|
| Data drift | Unexpected adverse event | Distribution shift via KS, PSI, JSD (source: nexcore-mcp drift_detection module, CLAUDE.md AI Engineering Bible Tools) |
| Bias emergence | Disproportionality signal | Fairness metric deviation (PRR analog) [unverified — scoring formula TBD] |
| Performance degradation | Efficacy decline | Accuracy/F1 decay over time windows [unverified — decay model TBD] |
| Hallucination frequency | Spontaneous report rate | Confabulation rate per query class [unverified — detection method TBD] |
| Alignment erosion | Benefit-risk ratio shift | Reward model divergence from human prefs [unverified — measurement TBD] |

### Taring the Scale (Baseline)

Every measurement requires a baseline. The scale reads zero before the specimen.

| Baseline | Source | Status |
|----------|--------|--------|
| Distribution fingerprint at training time | Training data statistics | GAP — method TBD |
| Fairness metrics at deployment | Protected attribute parity checks | GAP — weight formula TBD |
| Performance benchmarks at release | Eval suite results | GAP — benchmark selection TBD |
| Human preference alignment score | RLHF/DPO reward model snapshot | GAP — snapshot protocol TBD |
| Hallucination rate at launch | Confabulation detection baseline | GAP — detection method TBD |

### The Boundary: Science

The boundary is **science**. Not opinion. Not corporate policy. Not regulatory capture.

Algovigilance measurements must be:
- **Reproducible** — same data, same method, same result
- **Falsifiable** — every claim has a test that could disprove it
- **Transparent** — methods published, not proprietary black boxes
- **Conservative** — when uncertain, flag for human review (precautionary principle)

The `science.nexvigilant.com` boundary (source: nexvigilant-station MCP, `science_nexvigilant_com_*` tools) defines where observation meets rigor. Algovigilance operates inside this boundary — everything it reports is grounded in statistical evidence, not heuristics.

## Access Model: Observe, Don't Touch

### External Humans (Algovigilance Users)

**Can:**
- View real-time dashboards of AI training metrics
- See drift detection alerts and signal summaries
- Read plain-English explanations of what changed and why it matters
- Export observation reports (PDF, structured data)
- Set personal notification thresholds for signal types they care about

**Cannot:**
- Modify training parameters
- Interact with the AI system under observation
- Configure detection algorithms
- Access raw training data
- Override or dismiss signals

The metaphor: **a glass wall**. You can see everything. You can touch nothing. This preserves the integrity of both the observer and the observed.

### NexVigilant Internal (Operators)

**Can (everything external users can, plus):**
- Configure detection thresholds and sensitivity
- Define new signal types and scoring weights
- Map AI training events to PV-analog categories
- Wire algovigilance signals into the nexcore signal pipeline
- Set escalation rules (when does a drift signal become a "safety signal"?)
- Train the system on new baseline distributions
- Connect new AI training pipelines for monitoring

**Governed by:** NexVigilant's mission and vision. Configuration authority exists to serve the mission — not to suppress signals, not to hide inconvenient findings.

## Architecture (Anatomy / Physiology / Nervous System)

Following the Anatomy/Physiology Doctrine (source: ~/.claude/CLAUDE.md, Vision section).

| Layer | Component | Location | Status |
|-------|-----------|----------|--------|
| **Anatomy** (UI) | Algovigilance Dashboard | `nucleus/algovigilance/` | PLANNED |
| **Anatomy** (API) | Observer API (read-only) | `nexcore-api /algovigilance/*` | PLANNED |
| **Physiology** (Logic) | Signal detection, drift, triage | `nexcore-algovigilance` crate | EXISTS — dedup + triage (source: `nexcore-algovigilance/src/lib.rs`) |
| **Physiology** (Logic) | Drift detection | `nexcore-mcp` drift tools | EXISTS — KS, PSI, JSD (source: nexcore CLAUDE.md, AI Engineering Bible) |
| **Physiology** (Logic) | Micrograms for algo decisions | `rsk/micrograms/algo-*` | PLANNED |
| **Nervous System** (Transport) | MCP tools | `nexcore-mcp algovigil_*` | EXISTS — 6 tools (source: `nexcore-mcp/src/tools/algovigilance.rs`) |
| **Nervous System** (Config) | Operator configuration | `nexcore-algovigilance/store` | EXISTS — federated store (source: `nexcore-algovigilance/src/store.rs`) |

## Nexcore Energy Model

Algovigilance monitoring consumes energy (compute). The `nexcore-energy` crate manages token budgets (source: nexcore CLAUDE.md, Biological Crate System table).

| Operation | Energy Cost | Frequency | Status |
|-----------|-------------|-----------|--------|
| Drift detection (single distribution) | LOW | Per batch / per epoch | GAP — cost model TBD |
| Fairness audit (full sweep) | MEDIUM | Daily / weekly | GAP — cost model TBD |
| Signal triage (priority queue) | LOW | Continuous | EXISTS — `triage_queue` tool |
| Baseline recalibration | HIGH | On retraining events | GAP — trigger protocol TBD |
| Full observability report | MEDIUM | On demand | GAP — report format TBD |

## Gaps (Known Unknowns)

### Weight: How Do We Score?

The scoring function for algovigilance signals is undefined. PV uses PRR/ROR/IC/EBGM (source: nexcore-pv-core, signal detection algorithms) — the analogs for algorithmic vigilance need definition.

**Candidates** [all unverified — formulas to be validated]:
- PRR analog: `P(drift | model_A) / P(drift | all_models)` — disproportionality of drift in one model vs fleet
- ROR analog: Odds ratio of bias in subgroup vs population
- IC analog: Information component for unexpected behavior patterns
- EBGM analog: Empirical Bayes for hallucination clustering

**Decision needed:** Which scoring functions to implement first. The `nexcore-algovigilance` crate has triage with decay (source: `nexcore-algovigilance/src/triage/`) — but the **weight** (what makes a signal heavy vs light) needs definition.

### Training: How Do We Learn?

Algovigilance must learn from the systems it observes without interfering with them.

**Open questions:**
- How to ingest training logs without accessing training data?
- How to detect distribution shift from summary statistics alone?
- How to establish baselines when the model evolves continuously?
- How to distinguish intentional improvement from unintentional drift?

### Nexcore Energy Integration

How does continuous monitoring fit into the energy budget?

**Open questions:**
- What is the energy cost of monitoring per model per day?
- Can monitoring be throttled during low-risk periods?
- How does energy cost scale with model size?
- Should high-energy monitoring require operator approval?

## The Yellow Brick Road

Follow the mission. Follow the vision.

```
Phase 1: TAR THE SCALE
  - Define baselines for each signal type
  - Implement scoring functions (PV analogs)
  - Wire into nexcore-energy for cost tracking

Phase 2: SET THE BOUNDARY
  - Science boundary enforcement (reproducibility gates)
  - SMM integration for hypothesis validation
  - Microgram decision trees for signal classification

Phase 3: GLASS WALL
  - Observer API (read-only, authenticated)
  - Dashboard pages in Nucleus
  - Export and notification system

Phase 4: OPERATOR CONSOLE
  - NexVigilant-internal configuration UI
  - Threshold tuning with audit trail
  - Pipeline connection wizard ("Monitor this AI")
```

## Primitive Grounding

```
Algovigilance = ∂(Boundary) + κ(Comparison) + ν(Frequency) + ς(State) + N(Quantity)
                 |              |               |              |           |
                 |              |               |              |           +- Metrics, scores, counts
                 |              |               |              +- Mutable state of the observed system
                 |              |               +- Continuous monitoring cadence
                 |              +- Baseline vs current (drift detection)
                 +- Science boundary, observe-vs-configure boundary
```
