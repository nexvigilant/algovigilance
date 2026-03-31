# Nexcore Integration Map

How algovigilance connects to the existing nexcore ecosystem.

## Existing Assets (Already Built)

| Asset | Location | What It Provides |
|-------|----------|-----------------|
| `nexcore-algovigilance` crate | `nexcore/crates/nexcore-algovigilance/` | ICSR dedup, signal triage with decay, federated store (source: `nexcore-algovigilance/src/lib.rs`) |
| 6 MCP tools | `nexcore-mcp/src/tools/algovigilance.rs` | `dedup_pair`, `dedup_batch`, `triage_decay`, `triage_reinforce`, `triage_queue`, `status` (source: `nexcore-mcp/src/tools/algovigilance.rs`) |
| Drift detection tools | nexcore-mcp AI Engineering Bible module | `drift_ks_test`, `drift_psi`, `drift_jsd`, `drift_detect` (source: nexcore CLAUDE.md) |
| Observability tools | nexcore-mcp AI Engineering Bible module | `observability_record_latency`, `observability_query`, `observability_freshness` (source: nexcore CLAUDE.md) |
| `nexcore-energy` | `nexcore/crates/nexcore-energy/` | Token budget management for compute costs (source: nexcore CLAUDE.md, Biological Crate System) |
| Signal detection | `nexcore-pv-core` | PRR, ROR, IC, EBGM formulas to transfer (source: nexcore CLAUDE.md, Signal Detection benchmark) |

## Planned Integrations

### Energy Wiring (GAP-003)

```
monitoring_operation() → nexcore-energy::consume(cost) → budget_check()
                                                              |
                                                    if budget_exceeded → throttle_or_queue
```

### Signal Pipeline

```
drift_detect(distribution_A, distribution_B)
    → algo_prr / algo_ror / algo_ic  [GAP-001: scoring]
    → triage_queue (existing, with decay)
    → signal_to_action microgram [GAP-005]
    → observer API [GAP-006]
```

### Guardian Integration

The `nexcore-guardian` system monitors system health (source: nexcore CLAUDE.md, Biological Crate System). Algovigilance signals could feed guardian sensors — a critical drift signal becomes a guardian threat.

```
algovigilance_signal(severity=critical)
    → guardian_inject_signal(signal)
    → guardian_homeostasis_tick()  # system responds
```

### SMM Integration (GAP-004)

Scientific Method enforcement for hypothesis validation (source: smm MCP server, NVG-SMM-001).

```
drift_signal_detected
    → smm::create_investigation("Is model X drifting on metric Y?")
    → smm::assess_requirement (per phase)
    → smm::advance_phase
    → smm::complete_investigation → validated finding
```
