# Onboarding Page Refactor Plan

## Current State
- **File**: `src/app/nucleus/onboarding/page.tsx`
- **Lines**: 653
- **Pattern**: Single large client component with 4 steps and inline CRUD operations

## Target Architecture

Follow the assessment pattern from `careers/assessments/board-effectiveness/`:

```
src/app/nucleus/onboarding/
├── page.tsx                    # Server component (minimal)
├── onboarding-client.tsx       # Client orchestration (~150 lines)
├── step-components/
│   ├── index.ts
│   ├── profile-step.tsx        # Step 1: Name, title, bio
│   ├── education-step.tsx      # Step 2: Education history
│   ├── credentials-step.tsx    # Step 3: Credentials
│   └── affiliations-step.tsx   # Step 4: Affiliations & specializations
└── hooks/
    └── use-onboarding-form.ts  # Form state management hook
```

## Step 1: Extract Form Hook

Create `hooks/use-onboarding-form.ts` to encapsulate:
- Form initialization with react-hook-form
- Array field management (education, credentials, affiliations, specializations)
- CRUD operations (addEducation, removeEducation, etc.)
- Validation logic

```typescript
// hooks/use-onboarding-form.ts
export function useOnboardingForm() {
  const form = useForm<CompleteOnboardingInput>({...});

  // Array operations
  const addEducation = () => {...};
  const removeEducation = (index: number) => {...};
  // ... similar for credentials, affiliations, specializations

  return {
    form,
    education: { items: [...], add, remove },
    credentials: { items: [...], add, remove },
    affiliations: { items: [...], add, remove, save },
    specializations: { items: [...], add, remove, save },
  };
}
```

## Step 2: Extract Step Components

Each step component receives:
- Form register/setValue from parent
- Errors for its fields
- Array items and CRUD handlers

```typescript
// step-components/profile-step.tsx
interface ProfileStepProps {
  register: UseFormRegister<CompleteOnboardingInput>;
  errors: FieldErrors<CompleteOnboardingInput>;
}

export function ProfileStep({ register, errors }: ProfileStepProps) {
  return (
    <>
      {/* Name field */}
      {/* Professional title field */}
      {/* Bio field */}
    </>
  );
}
```

## Step 3: Create Orchestration Component

The main `onboarding-client.tsx` handles:
- Step navigation (current step, progress bar)
- Form submission to server action
- Success/error states
- Rendering correct step component

## Estimated Savings

| Component | Before | After |
|-----------|--------|-------|
| page.tsx | 653 | 15 |
| onboarding-client.tsx | - | 150 |
| use-onboarding-form.ts | - | 100 |
| profile-step.tsx | - | 80 |
| education-step.tsx | - | 100 |
| credentials-step.tsx | - | 80 |
| affiliations-step.tsx | - | 120 |
| **Total** | **653** | **645** |

Net savings is minimal in LOC, but the benefits are:
1. **Testability**: Each step can be unit tested in isolation
2. **Maintainability**: Changes to one step don't affect others
3. **Reusability**: Step components can be reused in profile editing
4. **Clarity**: Each file has single responsibility

## Implementation Order

1. [ ] Create `hooks/use-onboarding-form.ts`
2. [ ] Create `step-components/profile-step.tsx` (simplest)
3. [ ] Create `step-components/education-step.tsx`
4. [ ] Create `step-components/credentials-step.tsx`
5. [ ] Create `step-components/affiliations-step.tsx` (most complex)
6. [ ] Create `onboarding-client.tsx` orchestrator
7. [ ] Update `page.tsx` to minimal server component
8. [ ] Test full flow
9. [ ] Delete old inline code

## Priority

**P2** - Not urgent. Current implementation works but maintenance cost is higher.
Recommend implementing when:
- Adding new onboarding steps
- Fixing bugs in specific steps
- Refactoring profile editing to share components
