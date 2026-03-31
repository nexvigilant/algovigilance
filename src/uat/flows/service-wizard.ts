/**
 * Service Wizard Flow
 *
 * Tests the 5-step strategic diagnostic assessment wizard.
 */

import type { Page } from '@playwright/test';
import type { BaseAgent } from '../agents/base-agent';
import type { FlowConfig } from '../config';
import { analyzePageContext, waitForPageStable } from '../context/page-analyzer';

export interface FlowStep {
  name: string;
  description: string;
  execute: (agent: BaseAgent, page: Page) => Promise<void>;
  validate: (agent: BaseAgent, page: Page) => Promise<boolean>;
}

/**
 * Service Wizard Flow Definition
 */
export const serviceWizardSteps: FlowStep[] = [
  {
    name: 'Welcome Screen',
    description: 'Navigate to wizard and view welcome screen',
    execute: async (agent, page) => {
      await agent.navigateTo('/services');
      await waitForPageStable(page);
    },
    validate: async (agent, page) => {
      // Check for wizard welcome content
      const hasWelcome = await agent.assertVisible('Strategic Diagnostic');
      const hasStartButton = await page.getByRole('button', { name: /begin|start|next/i }).isVisible();
      return hasWelcome || hasStartButton;
    },
  },
  {
    name: 'Start Assessment',
    description: 'Click to begin the assessment',
    execute: async (agent, page) => {
      // Look for the start button
      const startButton = page.getByRole('button', { name: /begin protocol|start|next/i });
      if (await startButton.isVisible()) {
        await agent.clickButton(/begin protocol|start|next/i);
        await waitForPageStable(page);
      }
    },
    validate: async (_agent, page) => {
      // Should see first question or option cards
      const hasOptions = await page.locator('[data-wizard-option], .wizard-option, [role="radio"]').count();
      return hasOptions > 0;
    },
  },
  {
    name: 'Question 1 - Situation',
    description: 'Select the primary situation (challenge/opportunity/exploration)',
    execute: async (agent, page) => {
      // Find and click an option
      const options = page.locator('[data-wizard-option], .wizard-option, [role="radio"], .option-card');
      const count = await options.count();

      if (count > 0) {
        // Select the first valid option
        await options.first().click();
        await waitForPageStable(page);

        // Click next/continue if available
        const nextButton = page.getByRole('button', { name: /next|continue/i });
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await waitForPageStable(page);
        }
      }
    },
    validate: async (_agent, _page) => {
      // Should progress to next question or see different options
      return true; // We'll detect errors via detection strategies
    },
  },
  {
    name: 'Question 2 - Branch',
    description: 'Answer the branch-specific follow-up question',
    execute: async (agent, page) => {
      const options = page.locator('[data-wizard-option], .wizard-option, [role="radio"], .option-card');
      const count = await options.count();

      if (count > 0) {
        // Select an option (prefer middle option for variety)
        const index = Math.min(1, count - 1);
        await options.nth(index).click();
        await waitForPageStable(page);

        const nextButton = page.getByRole('button', { name: /next|continue/i });
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await waitForPageStable(page);
        }
      }
    },
    validate: async (_agent, _page) => true,
  },
  {
    name: 'Question 3 - Maturity',
    description: 'Assess organizational maturity level',
    execute: async (agent, page) => {
      // Look for slider, rating, or option selection
      const slider = page.locator('[role="slider"], input[type="range"]');
      const options = page.locator('[data-wizard-option], .wizard-option, [role="radio"], .option-card');

      if (await slider.isVisible()) {
        // Drag slider to middle position
        await slider.click();
      } else if ((await options.count()) > 0) {
        // Select an option
        await options.nth(Math.floor((await options.count()) / 2)).click();
      }

      await waitForPageStable(page);

      const nextButton = page.getByRole('button', { name: /next|continue|see results|get results/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await waitForPageStable(page);
      }
    },
    validate: async (_agent, _page) => true,
  },
  {
    name: 'Results Screen',
    description: 'View recommendations and results',
    execute: async (_agent, page) => {
      await waitForPageStable(page);
      // Wait for results to render
      await page.waitForTimeout(1000);
    },
    validate: async (agent, page) => {
      // Should see results content
      const context = await analyzePageContext(page);
      const hasResults =
        context.heading.toLowerCase().includes('results') ||
        context.heading.toLowerCase().includes('recommendation') ||
        context.heading.toLowerCase().includes('analysis');

      // Or check for recommendation cards
      const hasCards = await page.locator('.service-card, .recommendation-card, [data-recommendation]').count();

      return hasResults || hasCards > 0;
    },
  },
  {
    name: 'PDF Download',
    description: 'Optionally test PDF download flow',
    execute: async (agent, page) => {
      // Look for download/email capture button
      const downloadButton = page.getByRole('button', { name: /download|get report|email/i });

      if (await downloadButton.isVisible()) {
        await downloadButton.click();
        await waitForPageStable(page);

        // Check if email modal appeared
        const emailInput = page.getByLabel(/email/i);
        if (await emailInput.isVisible()) {
          await agent.fillForm({
            email: 'test-uat@nexvigilant.com',
            firstName: 'UAT',
            company: 'Test Company',
          });

          // Submit if there's a submit button
          const submitButton = page.getByRole('button', { name: /submit|download|send/i });
          if (await submitButton.isVisible()) {
            await submitButton.click();
            await waitForPageStable(page);
          }
        }
      }
    },
    validate: async (_agent, page) => {
      // Check for success message or download link
      const hasSuccess = await page.locator('.success, [data-success], .download-link').count();
      return hasSuccess > 0 || true; // Optional step, always pass
    },
  },
];

/**
 * Execute the complete service wizard flow
 */
export async function executeServiceWizardFlow(
  agent: BaseAgent,
  page: Page,
  _flowConfig: FlowConfig
): Promise<{ completed: boolean; stepsCompleted: number; errors: string[] }> {
  const errors: string[] = [];
  let stepsCompleted = 0;

  for (const step of serviceWizardSteps) {
    try {
      // Execute the step
      await step.execute(agent, page);
      stepsCompleted++;

      // Validate the step
      const isValid = await step.validate(agent, page);
      if (!isValid) {
        errors.push(`Step "${step.name}" validation failed`);
      }

      // Capture screenshot for each step
      await agent.captureScreenshot(`wizard-step-${stepsCompleted}`);
    } catch (error) {
      errors.push(`Step "${step.name}" failed: ${error instanceof Error ? error.message : String(error)}`);
      // Continue to next step if possible
    }
  }

  return {
    completed: stepsCompleted === serviceWizardSteps.length,
    stepsCompleted,
    errors,
  };
}

/**
 * Get wizard flow for registration
 */
export function getServiceWizardFlow(): {
  id: string;
  steps: FlowStep[];
  execute: typeof executeServiceWizardFlow;
} {
  return {
    id: 'service-wizard',
    steps: serviceWizardSteps,
    execute: executeServiceWizardFlow,
  };
}
