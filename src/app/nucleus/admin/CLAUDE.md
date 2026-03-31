# CLAUDE.md — Admin Module

The Admin module provides full operational control over the Nucleus platform — content management, user administration, analytics, and system monitoring.

## Benchmark Governance (INVARIANT)

This document describes the REALIZED state of this module — the standard we hold.

**The One Rule:** When reality diverges from what is stated here, improve reality. NEVER lower this document to match code.

## Pages

| Route | Purpose |
|-------|---------|
| `academy/analytics/` | Learning analytics with enrollment trends, completion rates, and engagement charts |
| `academy/content-pipeline/` | Content generation and review pipeline |
| `academy/ksb-builder/review/` | KSB content review queue |
| `academy/learners/` | Practitioner management and progress tracking |
| `academy/my-work/` | Admin work queue and task management |
| `academy/pipeline/` | Pathway generation pipeline status |
| `academy/pv-domains/` | PV domain and KSB framework management |
| `academy/operations/` | Academy operations dashboard |
| `academy/content/hierarchy/` | Content hierarchy browser |
| `community/moderation/` | Community post moderation queue |
| `community/onboarding/` | New member onboarding configuration |
| `content-freshness/` | Content age and staleness tracking |
| `content/` | Unified content management |
| `neural-visualization/` | Neural network visualization admin |
| `waitlist/` | Waitlist management |
| `affiliate-applications/` | Affiliate program applications |
| `intelligence/new/` | New intelligence article creation |

## Product Benchmarks

| Domain | Benchmark |
|--------|-----------|
| **Dashboard Pattern** | Every admin section with 8+ cards uses the data-driven tabbed dashboard pattern via `create:admin-dashboard` generator. |
| **Analytics** | Real-time analytics with Recharts. All chart data fetches server-side via server actions. Zero mock data in production. |
| **Content Pipeline** | Pathway generation completes with quality validation. All generated content passes automated review before publishing. |
| **Moderation** | Community moderation queue processes all flagged content within 24 hours. Automated toxicity detection pre-filters. |
| **RBAC** | Admin-only routes enforce role checks server-side. No client-side role gates alone — server actions verify `admin` role on every mutation. |
| **MCP Integration** | Admin operations use `mcp__studio__*` tools for user management, pathway operations, and content moderation. |

## Architecture Rules

- **Server actions for mutations**: All admin write operations use `'use server'` actions with Admin SDK
- **Role verification**: Every server action checks `role === 'admin'` before proceeding
- **Scoped logging**: All admin pages use `logger.scope('admin/<section>')`
- **Tabbed dashboards**: 8+ card pages use the nav-config + dashboard-tabs pattern
