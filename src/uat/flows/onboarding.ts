/**
 * Onboarding Flow
 *
 * Tests the 4-step member onboarding process.
 */

import type { Page } from '@playwright/test';
import type { BaseAgent } from '../agents/base-agent';
import type { FlowConfig } from '../config';
import { waitForPageStable, analyzePageContext } from '../context/page-analyzer';

/**
 * Test data for onboarding form
 */
const testOnboardingData = {
  // Step 1: Basic Info
  fullName: 'UAT Test User',
  professionalTitle: 'Pharmacovigilance Specialist',
  bio: 'Automated UAT test user for platform validation.',
  location: 'Test City, TC',

  // Step 2: Education
  institution: 'Test University',
  degree: 'Bachelor of Science',
  fieldOfStudy: 'Pharmaceutical Sciences',
  graduationYear: '2020',

  // Step 3: Experience
  currentEmployer: 'UAT Test Corp',
  yearsExperience: '5',
  linkedInUrl: 'https://linkedin.com/in/uat-test',

  // Step 4: Affiliations
  affiliations: ['ISPE', 'DIA'],
  specializations: ['Signal Detection', 'ICSR Processing'],
};

interface OnboardingStepResult {
  step: number;
  name: string;
  success: boolean;
  errors: string[];
}

/**
 * Complete step 1: Basic Information
 */
async function completeStep1(agent: BaseAgent, page: Page): Promise<OnboardingStepResult> {
  const errors: string[] = [];

  try {
    // Fill basic info fields
    const nameInput = page.getByLabel(/full name|name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill(testOnboardingData.fullName);
    } else {
      errors.push('Full name field not found');
    }

    const titleInput = page.getByLabel(/title|professional title/i);
    if (await titleInput.isVisible()) {
      await titleInput.fill(testOnboardingData.professionalTitle);
    }

    const bioInput = page.getByLabel(/bio|about/i);
    if (await bioInput.isVisible()) {
      await bioInput.fill(testOnboardingData.bio);
    }

    const locationInput = page.getByLabel(/location/i);
    if (await locationInput.isVisible()) {
      await locationInput.fill(testOnboardingData.location);
    }

    // Click next
    const nextButton = page.getByRole('button', { name: /next|continue/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await waitForPageStable(page);
    } else {
      errors.push('Next button not found');
    }

    await agent.captureScreenshot('onboarding-step-1');

    return { step: 1, name: 'Basic Information', success: errors.length === 0, errors };
  } catch (error) {
    return {
      step: 1,
      name: 'Basic Information',
      success: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * Complete step 2: Education & Credentials
 */
async function completeStep2(agent: BaseAgent, page: Page): Promise<OnboardingStepResult> {
  const errors: string[] = [];

  try {
    // Look for education fields
    const institutionInput = page.getByLabel(/institution|university|school/i);
    if (await institutionInput.isVisible()) {
      await institutionInput.fill(testOnboardingData.institution);
    }

    const degreeInput = page.getByLabel(/degree/i);
    if (await degreeInput.isVisible()) {
      await degreeInput.fill(testOnboardingData.degree);
    }

    const fieldInput = page.getByLabel(/field|major|study/i);
    if (await fieldInput.isVisible()) {
      await fieldInput.fill(testOnboardingData.fieldOfStudy);
    }

    const yearInput = page.getByLabel(/year|graduation/i);
    if (await yearInput.isVisible()) {
      await yearInput.fill(testOnboardingData.graduationYear);
    }

    // Click next
    const nextButton = page.getByRole('button', { name: /next|continue/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await waitForPageStable(page);
    }

    await agent.captureScreenshot('onboarding-step-2');

    return { step: 2, name: 'Education & Credentials', success: errors.length === 0, errors };
  } catch (error) {
    return {
      step: 2,
      name: 'Education & Credentials',
      success: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * Complete step 3: Professional Experience
 */
async function completeStep3(agent: BaseAgent, page: Page): Promise<OnboardingStepResult> {
  const errors: string[] = [];

  try {
    const employerInput = page.getByLabel(/employer|company|organization/i);
    if (await employerInput.isVisible()) {
      await employerInput.fill(testOnboardingData.currentEmployer);
    }

    const experienceInput = page.getByLabel(/years|experience/i);
    if (await experienceInput.isVisible()) {
      await experienceInput.fill(testOnboardingData.yearsExperience);
    }

    const linkedInInput = page.getByLabel(/linkedin/i);
    if (await linkedInInput.isVisible()) {
      await linkedInInput.fill(testOnboardingData.linkedInUrl);
    }

    // Click next
    const nextButton = page.getByRole('button', { name: /next|continue/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await waitForPageStable(page);
    }

    await agent.captureScreenshot('onboarding-step-3');

    return { step: 3, name: 'Professional Experience', success: errors.length === 0, errors };
  } catch (error) {
    return {
      step: 3,
      name: 'Professional Experience',
      success: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * Complete step 4: Affiliations & Specializations
 */
async function completeStep4(agent: BaseAgent, page: Page): Promise<OnboardingStepResult> {
  const errors: string[] = [];

  try {
    // Add affiliations (may be tag input or multi-select)
    const affiliationInput = page.getByLabel(/affiliation|organization/i);
    if (await affiliationInput.isVisible()) {
      for (const affiliation of testOnboardingData.affiliations) {
        await affiliationInput.fill(affiliation);
        // Press enter or click add button
        await affiliationInput.press('Enter');
        await page.waitForTimeout(300);
      }
    }

    // Add specializations
    const specInput = page.getByLabel(/specialization|expertise|area/i);
    if (await specInput.isVisible()) {
      for (const spec of testOnboardingData.specializations) {
        await specInput.fill(spec);
        await specInput.press('Enter');
        await page.waitForTimeout(300);
      }
    }

    await agent.captureScreenshot('onboarding-step-4');

    // Click complete/submit
    const submitButton = page.getByRole('button', { name: /complete|submit|finish/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await waitForPageStable(page);
    }

    return { step: 4, name: 'Affiliations & Specializations', success: errors.length === 0, errors };
  } catch (error) {
    return {
      step: 4,
      name: 'Affiliations & Specializations',
      success: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * Execute the complete onboarding flow
 */
export async function executeOnboardingFlow(
  agent: BaseAgent,
  page: Page,
  _flowConfig: FlowConfig
): Promise<{
  completed: boolean;
  stepResults: OnboardingStepResult[];
  redirectedToNucleus: boolean;
}> {
  const stepResults: OnboardingStepResult[] = [];

  try {
    // Navigate to onboarding
    await agent.navigateTo('/nucleus/onboarding');
    await waitForPageStable(page);

    // Check if already redirected (onboarding complete)
    const context = await analyzePageContext(page);
    if (context.url.includes('/nucleus') && !context.url.includes('/onboarding')) {
      return {
        completed: true,
        stepResults: [],
        redirectedToNucleus: true,
      };
    }

    // Complete each step
    stepResults.push(await completeStep1(agent, page));
    stepResults.push(await completeStep2(agent, page));
    stepResults.push(await completeStep3(agent, page));
    stepResults.push(await completeStep4(agent, page));

    // Check if redirected to nucleus after completion
    await page.waitForTimeout(2000);
    const finalContext = await analyzePageContext(page);
    const redirectedToNucleus =
      finalContext.url.includes('/nucleus') && !finalContext.url.includes('/onboarding');

    await agent.captureScreenshot('onboarding-complete');

    return {
      completed: stepResults.every((s) => s.success),
      stepResults,
      redirectedToNucleus,
    };
  } catch (error) {
    return {
      completed: false,
      stepResults,
      redirectedToNucleus: false,
    };
  }
}

/**
 * Get onboarding flow for registration
 */
export function getOnboardingFlow(): {
  id: string;
  execute: typeof executeOnboardingFlow;
} {
  return {
    id: 'onboarding',
    execute: executeOnboardingFlow,
  };
}
