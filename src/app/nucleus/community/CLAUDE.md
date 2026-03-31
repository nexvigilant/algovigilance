# CLAUDE.md — Community Module

The Community module powers practitioner networking, knowledge sharing, and peer collaboration — the social fabric of the Nucleus platform.

## Benchmark Governance (INVARIANT)

This document describes the REALIZED state of this module — the standard we hold.

**The One Rule:** When reality diverges from what is stated here, improve reality. NEVER lower this document to match code.

## Pages

| Route | Purpose |
|-------|---------|
| `circles/` | Forum directory — browse and join professional circles |
| `circles/create-post/` | Create new discussion post |
| `discover/` | Community discovery and exploration |
| `discover/results/` | Discovery search results |
| `find-your-home/` | Guided community onboarding |
| `for-you/` | Personalized feed |
| `messages/` | Direct messaging |
| `notifications/` | Activity notifications |
| `onboarding/` | New member onboarding flow |
| `search/` | Community-wide search |
| `settings/profile/` | Community profile settings |
| `analytics/` | Community engagement analytics |
| `marketplace/` | Knowledge marketplace |
| `benchmarks/` | Community benchmarking tools |
| `case-studies/` | Shared case study library |

## Product Benchmarks

| Domain | Benchmark |
|--------|-----------|
| **Engagement** | Active community with >50% monthly active rate among enrolled practitioners. Forum posts receive responses within 24 hours. |
| **Discovery** | Personalized `for-you` feed surfaces relevant content using practitioner profile, specialization, and activity signals. |
| **Moderation** | All posts pass automated content filtering. Moderator queue handles flagged content within 24 hours. Zero spam reaches the feed. |
| **Messaging** | Direct messaging delivers with <1s latency. Message history persists with proper Firestore security rules. |
| **Circles** | Professional circles support topic-based discussion, pinned resources, and member roles (owner, moderator, member). |
| **Search** | Community search returns relevant results in <500ms across posts, circles, members, and case studies. |
| **Accessibility** | All community interactions (posting, replying, voting, messaging) are fully keyboard-navigable and screen-reader accessible. |

## Data Flow

- **Posts**: Firestore `/community_posts/{id}` with replies subcollection
- **Moderation**: `mcp__studio__studio_posts_moderate` for pin/lock/hide operations
- **Member data**: `useAuth()` for current user, Firestore `/users/{id}` for profiles
- **Real-time**: Firestore listeners for live feed updates

## Content Rules

- **DOMPurify** sanitizes all user-generated HTML and rendered markdown output
- **marked** parses markdown to HTML before DOMPurify sanitization
- **XSS prevention** on every render path — zero unescaped user input
