/**
 * Public Pages Flow
 *
 * Tests all public-facing pages for accessibility and functionality.
 */

import type { Page } from '@playwright/test';
import type { BaseAgent } from '../agents/base-agent';
import type { FlowConfig } from '../config';
import { analyzePageContext, waitForPageStable } from '../context/page-analyzer';

/**
 * List of public pages to test
 */
export const publicPages = [
  { path: '/', name: 'Landing Page', critical: true },
  { path: '/about', name: 'About Page', critical: true },
  { path: '/academy', name: 'Academy Marketing', critical: true },
  { path: '/services', name: 'Services/Wizard', critical: true },
  { path: '/intelligence', name: 'Intelligence Hub', critical: true },
  { path: '/membership', name: 'Membership', critical: true },
  { path: '/consulting', name: 'Consulting', critical: false },
  { path: '/contact', name: 'Contact', critical: true },
  { path: '/careers', name: 'Careers', critical: false },
  { path: '/privacy', name: 'Privacy Policy', critical: false },
  { path: '/terms', name: 'Terms of Service', critical: false },
  { path: '/verify', name: 'Verification', critical: false },
];

export interface PageTestResult {
  path: string;
  name: string;
  success: boolean;
  loadTime: number;
  errors: string[];
  warnings: string[];
}

/**
 * Test a single public page
 */
async function testPublicPage(
  agent: BaseAgent,
  page: Page,
  pageInfo: (typeof publicPages)[0]
): Promise<PageTestResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const startTime = Date.now();

  try {
    // Navigate to the page
    await agent.navigateTo(pageInfo.path);
    await waitForPageStable(page);

    const loadTime = Date.now() - startTime;

    // Analyze page context
    const context = await analyzePageContext(page);

    // Check for error indicators
    if (context.errorMessages.length > 0) {
      errors.push(...context.errorMessages);
    }

    // Check page has content
    if (!context.heading && !context.title) {
      warnings.push('Page has no heading or title');
    }

    // Check for broken navigation
    const brokenLinks = context.visibleElements.filter(
      (e) => e.type === 'link' && (!e.text || e.text.trim() === '')
    );
    if (brokenLinks.length > 0) {
      warnings.push(`${brokenLinks.length} link(s) have no text`);
    }

    // Check for console errors (these would be captured by strategies)
    // Here we just verify the page loaded

    // Check loading time
    if (loadTime > 5000) {
      warnings.push(`Slow page load: ${loadTime}ms`);
    }

    // Take screenshot
    await agent.captureScreenshot(`public-${pageInfo.path.replace(/\//g, '-')}`);

    return {
      path: pageInfo.path,
      name: pageInfo.name,
      success: errors.length === 0,
      loadTime,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      path: pageInfo.path,
      name: pageInfo.name,
      success: false,
      loadTime: Date.now() - startTime,
      errors: [error instanceof Error ? error.message : String(error)],
      warnings,
    };
  }
}

/**
 * Test navigation between pages
 */
async function testNavigation(agent: BaseAgent, page: Page): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Start from landing page
    await agent.navigateTo('/');
    await waitForPageStable(page);

    // Get navigation links
    const context = await analyzePageContext(page);
    const navLinks = context.navigation.filter((n) => n.href && !n.href.includes('mailto:'));

    // Test a subset of navigation links
    const linksToTest = navLinks.slice(0, 5);

    for (const link of linksToTest) {
      try {
        await agent.clickLink(new RegExp(link.text, 'i'));
        await waitForPageStable(page);

        // Verify we navigated
        const newContext = await analyzePageContext(page);
        if (newContext.url === context.url) {
          errors.push(`Navigation to "${link.text}" didn't change URL`);
        }

        // Go back for next test
        await page.goBack();
        await waitForPageStable(page);
      } catch (error) {
        errors.push(`Failed to navigate to "${link.text}": ${error}`);
      }
    }

    return { success: errors.length === 0, errors };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * Test contact form submission
 */
async function testContactForm(agent: BaseAgent, page: Page): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    await agent.navigateTo('/contact');
    await waitForPageStable(page);

    // Look for form fields
    const context = await analyzePageContext(page);

    if (context.forms.length === 0) {
      errors.push('No form found on contact page');
      return { success: false, errors };
    }

    // Fill form with test data
    await agent.fillForm({
      Name: 'UAT Test User',
      Email: 'uat-test@nexvigilant.com',
      Company: 'UAT Testing Inc',
      Message: 'This is an automated UAT test submission. Please ignore.',
    });

    // Don't actually submit in UAT - just verify form can be filled
    await agent.captureScreenshot('contact-form-filled');

    return { success: true, errors };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

/**
 * Execute the complete public pages flow
 */
export async function executePublicPagesFlow(
  agent: BaseAgent,
  page: Page,
  _flowConfig: FlowConfig
): Promise<{
  completed: boolean;
  pageResults: PageTestResult[];
  navigationResult: { success: boolean; errors: string[] };
  contactFormResult: { success: boolean; errors: string[] };
}> {
  const pageResults: PageTestResult[] = [];

  // Test each public page
  for (const pageInfo of publicPages) {
    const result = await testPublicPage(agent, page, pageInfo);
    pageResults.push(result);
  }

  // Test navigation
  const navigationResult = await testNavigation(agent, page);

  // Test contact form
  const contactFormResult = await testContactForm(agent, page);

  // Calculate overall completion
  const criticalPagesOk = pageResults
    .filter((r) => publicPages.find((p) => p.path === r.path)?.critical)
    .every((r) => r.success);

  return {
    completed: criticalPagesOk && navigationResult.success,
    pageResults,
    navigationResult,
    contactFormResult,
  };
}

/**
 * Get public pages flow for registration
 */
export function getPublicPagesFlow(): {
  id: string;
  execute: typeof executePublicPagesFlow;
} {
  return {
    id: 'public-pages',
    execute: executePublicPagesFlow,
  };
}
