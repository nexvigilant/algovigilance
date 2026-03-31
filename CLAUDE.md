# CLAUDE.md — Algovigilance

Algorithmic vigilance platform. Applies PV discipline to AI training monitoring.

## Project Identity

| Key | Value |
|-----|-------|
| Location | `~/Projects/Active/algovigilance/` |
| Purpose | AI training vigilance — observe, measure, report |
| Rust crate | `nexcore-algovigilance` (source: `~/Projects/Active/nexcore/crates/nexcore-algovigilance/`) |
| MCP tools | `algovigil_*` (6 tools via nexcore-mcp) |
| Drift tools | `drift_ks_test`, `drift_psi`, `drift_jsd`, `drift_detect` (source: nexcore-mcp AI Engineering Bible) |

## Core Principle: Glass Wall

External users **observe only**. NexVigilant operators **configure**.

| Actor | Read | Write | Configure |
|-------|------|-------|-----------|
| External human | Yes | No | No |
| NexVigilant operator | Yes | Yes | Yes |
| Automated pipeline | Yes | Emit signals only | No |

## Architecture Mapping

| Layer | What | Where |
|-------|------|-------|
| Anatomy (UI) | Observer dashboard | `nucleus/algovigilance/` (planned) |
| Physiology (Logic) | Scoring, drift, triage | `nexcore-algovigilance` + drift_detection tools |
| Nervous System | MCP transport | `algovigil_*` tools + observer API (planned) |
| Micrograms | Decision trees | `rsk/micrograms/algo-*` (planned) |

## Working In This Project

- Vision and roadmap: `VISION.md`
- Gap analysis: `docs/gaps.md`
- Access model spec: `docs/access-model.md`
- Scoring candidates: `docs/scoring.md`
- Microgram stubs: `micrograms/`

## Key Commands

```bash
# Existing tools (via nexcore)
cargo test -p nexcore-algovigilance --lib     # Test the crate
cargo build -p nexcore-mcp --release          # Rebuild MCP with algovigil tools

# Micrograms (when created)
cd ~/Projects/rsk-core
./target/release/rsk mcg test rsk/micrograms/algo-drift-classify.yaml
```
