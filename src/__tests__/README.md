# Test Suite (Quality Assurance)

> **Path:** `src/__tests__`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** QA & Core Engineering

---

## Overview

| Suite | Location | Count | Command |
|-------|----------|-------|---------|
| Unit Tests | `src/__tests__/unit/` | 598 | `npm run test:unit` |
| E2E Tests | `cypress/e2e/` | 233 | `npm run test:e2e` |
| Accessibility | `scripts/tests/accessibility/` | -- | `npm run test:a11y` |

**Total Tests: 831+**

## Test Strategy

### Unit Tests (`src/__tests__/unit/`)

Focus on **pure functions, validation logic, and business rules** that don't require external dependencies.

| Test File | Coverage Area | Tests |
|-----------|---------------|-------|
| `affiliate-schemas.test.ts` | Ambassador/Advisor form Zod schemas | 35 |
| `affiliate-scoring.test.ts` | Application scoring algorithm | 25 |
| `api-auth-token.test.ts` | Token validation logic, cookie config | 18 |
| `auth-errors.test.ts` | Firebase error handling, type guards, message translation | 48 |
| `community-constants.test.ts` | Reputation system, badges, helpers | 34 |
| `contact-schemas.test.ts` | Contact form Zod validation | 20 |
| `content-validation.test.ts` | Claim extraction, health score calculation, issue creation | 35 |
| `email-templates.test.ts` | Email template generation | 40 |
| `extract-sections.test.ts` | Markdown heading extraction, URL-friendly ID generation | 35 |
| `firestore-schemas.test.ts` | Firestore document Zod schemas | 31 |
| `firestore-utils.test.ts` | Timestamp parsing, path building, data sanitization | 30 |
| `form-utils.test.ts` | Server action wrappers, Zod validation integration | 22 |
| `logger.test.ts` | Log level filtering, scoped loggers, data sanitization | 25 |
| `security-validation.test.ts` | XSS prevention, injection detection, secure schemas | 72 |
| `utils.test.ts` | Core utilities (cn classname merger, toDate timestamp converter) | 45 |
| `waitlist-schema.test.ts` | Waitlist form validation | 15 |
| `wizard-questions.test.ts` | Service wizard question flow | 45 |
| `wizard-scoring.test.ts` | Wizard response scoring | 23 |

### E2E Tests (`cypress/e2e/`)

Focus on **user flows, page rendering, and API integration**.

| Test File | Coverage Area |
|-----------|---------------|
| `auth.cy.ts` | Authentication flows, maintenance mode, protected routes |
| `form-submissions.cy.ts` | Contact, waitlist, ambassador, advisor forms |
| `public-pages.cy.ts` | Public page rendering, navigation |
| `service-wizard.cy.ts` | Service discovery wizard flow |
| `smoke.cy.ts` | Critical path smoke tests |

### What's NOT Unit Tested (and Why)

#### Server Actions (`src/lib/actions/`, `src/app/nucleus/*/actions/`)
- **40 files** tightly coupled with Firebase Admin SDK
- Require Firebase mocking infrastructure or integration testing
- **Mitigation:** E2E tests cover user-facing functionality

#### API Routes (`src/app/api/`)
- **16 route handlers** using Next.js App Router Web APIs
- Jest's jsdom environment doesn't support Request/Response
- **Mitigation:** Validation logic extracted and tested; E2E tests cover full routes

## Test Infrastructure

### Mocks (`src/__tests__/__mocks__/`)

| Mock | Purpose |
|------|---------|
| `lucide-react.tsx` | Prevents ESM import issues |
| `firebase-admin.ts` | Mock Firebase Admin SDK (ready for use) |

### Helpers (`src/__tests__/helpers/`)

| Helper | Purpose |
|--------|---------|
| `api-test-utils.ts` | Mock request creation, response parsing |

## Commands

```bash
# Run all unit tests
npm run test:unit

# Run all E2E tests (requires dev server running)
npm run test:e2e

# Run specific test file
npx jest src/__tests__/unit/<filename>.test.ts

# Run Cypress interactively
npx cypress open

# Run accessibility tests
npm run test:a11y

# Run all tests
npm run test:all
```

## Coverage Strategy

1. **Pure Functions First** - Maximum ROI with minimal mocking
2. **Zod Schemas** - Validates data contracts without dependencies
3. **Business Logic** - Scoring algorithms, constants, helpers
4. **E2E for Integration** - Full user flows catch integration issues

## Future Improvements

1. **Firebase Admin SDK Mocking** - Enable server action unit testing
2. **API Route Integration Tests** - Use @edge-runtime/jest-environment
3. **Visual Regression Tests** - Add Percy or similar for UI consistency
4. **Performance Budgets** - Add Lighthouse CI thresholds

## Test Naming Conventions

- Unit tests: `*.test.ts` in `src/__tests__/unit/`
- E2E tests: `*.cy.ts` in `cypress/e2e/`
- Accessibility: Custom jest-axe setup

## Related Documentation

- [ACCESSIBILITY-TESTING-CHECKLIST.md](../../docs/technical/ACCESSIBILITY-TESTING-CHECKLIST.md)
- [TECH-STACK.md](../../docs/technical/TECH-STACK.md)
