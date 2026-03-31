# Access Model: Glass Wall Architecture

## Principle

Humans from algovigilance can **look, not touch or interact — merely observe**.
NexVigilant operators can **configure** because NexVigilant is locked into achieving its mission and vision.

## Two-Tier Access

### Tier 1: Observer (External)

**Authentication:** Required (identity, not authorization to act).

**Permissions matrix:**

| Resource | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| `/algovigilance/signals` | Yes | No | No | No |
| `/algovigilance/dashboards` | Yes | No | No | No |
| `/algovigilance/reports` | Yes | No | No | No |
| `/algovigilance/baselines` | Yes (summary) | No | No | No |
| `/algovigilance/config` | No | No | No | No |
| `/algovigilance/thresholds` | No | No | No | No |
| Raw training data | No | No | No | No |

**Enforcement point:** API gateway (not UI-only restriction).
Every mutation endpoint returns `403 Forbidden` for observer tokens regardless of request body.

**What observers see:**
- Signal type, severity, timestamp, trend
- Plain-English explanation of what the signal means
- Drift magnitude (not raw distributions)
- Aggregate statistics (not individual data points)

### Tier 2: Operator (NexVigilant Internal)

**Authentication:** NexVigilant SSO + role verification.

**Additional permissions:**

| Resource | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| `/algovigilance/config` | Yes | Yes | Yes | No |
| `/algovigilance/thresholds` | Yes | Yes | Yes | No |
| `/algovigilance/pipelines` | Yes | Yes | Yes | Yes |
| `/algovigilance/baselines` | Yes (full) | Yes (recalibrate) | No | No |

**Governance constraint:** Operators serve the mission (source: ~/.claude/CLAUDE.md, Vision section). Configuration changes are audited. Operators cannot:
- Suppress signals without documented justification
- Lower sensitivity below science-boundary minimums
- Delete observation history
- Modify data retroactively

## Implementation Notes

**Boundary caution applies** (`boundary_caution=0.718`). The observer/operator boundary is an API surface where errors cascade. Auth enforcement must be at the transport layer, not application logic.

**Nexcore wiring:** Observer API routes through `nexcore-api`. Operator API requires a separate auth middleware that checks NexVigilant internal role claims. Both share the same `nexcore-algovigilance` crate for computation — access control is in the service layer, not the domain layer (source: nexcore CLAUDE.md, Layer Architecture).
