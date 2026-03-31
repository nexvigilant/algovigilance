# Academy Module (Capability Pathways)

> **Path:** `src/app/nucleus/academy`

---

## 🎯 Purpose

The **Academy** is the educational heart of the NexVigilant Nucleus. It provides structured, domain-specific capability pathways for healthcare professionals, enabling them to move from knowledge ingestion to verified practical application. This module implements the "Capability Over Credentials" core value, ensuring that practitioners can objectively prove their expertise in pharmacovigilance and strategic vigilance.

## 🚀 Development Goals

1. **Structured Progression**: Implement the PDC v4.1 DAG architecture to ensure a logical flow between foundational KSBs and advanced EPAs.
2. **Interactive Mastery**: Leverage the FSRS (Spaced Repetition) algorithm to optimize retention and identify specific knowledge gaps.
3. **Verified Deliverables**: Automate the generation of immutable `CapabilityVerification` artifacts (formerly Certificates) upon stage completion.
4. **Agentic Coaching**: Integrate the `nexvigilant-agent` to provide real-time feedback during practice activities.

## 🔭 Action Items & Aspirations

- [ ] **GVP Curriculum Launch**: Complete the full mapping of EMA GVP modules into interactive building blocks.
- [ ] **Portfolio Integration**: Enable practitioners to link their verified capabilities directly to their professional portfolios.
- [ ] **Collaborative Pathways**: Launch "Study Circles" to allow peer-reviewed capability development.
- [ ] **Mobile-First Build**: Refactor the `interactive/` module for sub-second performance on high-latency networks.

## 🛡️ Management Measures

- **Progress Integrity**: All enrollment and progress data is strictly owner-scoped in Firestore, with admin-only write access to course definitions.
- **Content Validation**: Every pathway must pass the `validate:course` script, which checks for missing KSB links or broken stage sequences.
- **Audit Logging**: Successful verifications are recorded as a `Critical` audit event in the `vr-compliance` module.
- **Layout Consistency**: Must utilize the `NucleusLayout` and `AcademyBreadcrumbs` to maintain portal-wide navigation parity.

---

## Key Subdirectories
- `/pathways/`: Primary route for browsing available capability journeys.
- `/build/`: Interactive build-mode for hands-on practice activities.
- `/ksb/`: Comprehensive viewer for the 1,286 Knowledge, Skill, and Behavior items.
- `/verifications/`: Repository of verified practitioner achievements.
