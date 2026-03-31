# Guardian Module (Strategic Vigilance)

> **Path:** `src/app/nucleus/guardian`

---

## 🎯 Purpose

The **Guardian** module is the primary operational interface for pharmaceutical safety surveillance. It provides high-resolution dashboards and analytical tools for monitoring safety signals, assessing causality, and enforcing the Theory of Vigilance (ToV) across global drug-event datasets. This module serves as the visual facade for the `nexvigilant-guardian` backend platform.

## 🚀 Development Goals

1. **Low-Latency Signal Visualization**: Render complex signal trajectories and disproportionality results with sub-second response times.
2. **Clinical Decision Support**: Integrate automated Naranjo and WHO-UMC causality tools directly into the case review workflow.
3. **Multi-Source Fusion**: Harmonize data from FAERS, EudraVigilance, and private datasets into a unified "Campion Grid" view.
4. **Autonomous Triage**: Implement AI-driven signal prioritization based on evolved "Forge Strategy" parameters.

## 🔭 Action Items & Aspirations

- [ ] **Real-time FAERS Bridge**: Finalize the streaming ingestion of the latest FDA quarterly data.
- [ ] **Predictive Safety Manifold**: Launch the 3D WebGL visualization of current drug safety boundaries.
- [ ] **Collaborative Investigations**: Enable multi-expert investigations with immutable audit trails.
- [ ] **Mobile Signal Alerts**: Develop a specialized PWA interface for critical safety alerts.

## 🛡️ Management Measures

- **Trade Secret Protection**: Operates under **STEALTH MODE**. Source code for specific algorithms must never be exposed to the client bundle.
- **Role-Based Gating**: Access to raw ICSR data is strictly limited to `Professional` and `Admin` roles.
- **Forensic Tagging**: All results must include the `forensic` metadata (confidence, category) as defined in the `nexcore-mcp` spec.
- **Safety Boundaries**: Dashboard metrics must trigger "Red Flag" UI states immediately when a ToV axiomatic violation is detected.

---

## Technical Integration
- Interfaces with the `vr-platform-ml` crate for benchmarking results.
- Uses `src/proxy.ts` for strictly enforced tenant isolation.
- Renders components from `components/vigilance/`.
