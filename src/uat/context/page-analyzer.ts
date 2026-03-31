/**
 * Page Analyzer
 *
 * Extracts contextual information from the current page state
 * for AI-driven decision making.
 *
 * Uses Playwright's built-in locator methods to avoid page.evaluate
 * transpilation issues with tsx/TypeScript.
 */

import type { Page, Locator } from '@playwright/test';

export interface InteractiveElement {
  selector: string;
  type: 'button' | 'link' | 'input' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'form';
  text: string;
  isEnabled: boolean;
  isVisible: boolean;
  ariaLabel?: string;
  role?: string;
  testId?: string;
}

export interface FormState {
  id: string;
  action?: string;
  method?: string;
  fields: FormField[];
  isValid: boolean;
  hasErrors: boolean;
  errorMessages: string[];
}

export interface FormField {
  name: string;
  type: string;
  label?: string;
  value: string;
  required: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export interface PageContext {
  url: string;
  title: string;
  heading: string;
  visibleElements: InteractiveElement[];
  forms: FormState[];
  alerts: string[];
  errorMessages: string[];
  loadingIndicators: number;
  modals: { title: string; isOpen: boolean }[];
  breadcrumbs: string[];
  navigation: { text: string; href: string; isActive: boolean }[];
}

/**
 * Extract text from a locator, returning empty string if not found
 */
async function safeGetText(locator: Locator): Promise<string> {
  try {
    const count = await locator.count();
    if (count === 0) return '';
    return (await locator.first().textContent()) || '';
  } catch {
    return '';
  }
}

/**
 * Analyze the current page and extract context for AI decision making
 */
export async function analyzePageContext(page: Page): Promise<PageContext> {
  const url = page.url();
  const title = await page.title();

  // Get main heading
  const heading = await safeGetText(page.locator('h1').first());

  // Get visible buttons
  const buttons: InteractiveElement[] = [];
  const buttonLocators = page.locator('button:visible');
  const buttonCount = await buttonLocators.count();
  for (let i = 0; i < Math.min(buttonCount, 20); i++) {
    const btn = buttonLocators.nth(i);
    try {
      buttons.push({
        selector: `button:nth-of-type(${i + 1})`,
        type: 'button',
        text: ((await btn.textContent()) || '').trim().slice(0, 100),
        isEnabled: await btn.isEnabled(),
        isVisible: true,
        ariaLabel: (await btn.getAttribute('aria-label')) || undefined,
      });
    } catch {
      // Skip elements that error
    }
  }

  // Get visible links
  const links: InteractiveElement[] = [];
  const linkLocators = page.locator('a[href]:visible');
  const linkCount = await linkLocators.count();
  for (let i = 0; i < Math.min(linkCount, 20); i++) {
    const link = linkLocators.nth(i);
    try {
      links.push({
        selector: `a:nth-of-type(${i + 1})`,
        type: 'link',
        text: ((await link.textContent()) || '').trim().slice(0, 100),
        isEnabled: true,
        isVisible: true,
        ariaLabel: (await link.getAttribute('aria-label')) || undefined,
      });
    } catch {
      // Skip elements that error
    }
  }

  // Get visible inputs
  const inputs: InteractiveElement[] = [];
  const inputLocators = page.locator('input:visible, textarea:visible, select:visible');
  const inputCount = await inputLocators.count();
  for (let i = 0; i < Math.min(inputCount, 15); i++) {
    const input = inputLocators.nth(i);
    try {
      const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
      const inputType = await input.getAttribute('type');
      let type: InteractiveElement['type'] = 'input';
      if (tagName === 'select') type = 'select';
      else if (tagName === 'textarea') type = 'textarea';
      else if (inputType === 'checkbox') type = 'checkbox';
      else if (inputType === 'radio') type = 'radio';

      inputs.push({
        selector: `input:nth-of-type(${i + 1})`,
        type,
        text: (await input.getAttribute('placeholder')) || '',
        isEnabled: await input.isEnabled(),
        isVisible: true,
        ariaLabel: (await input.getAttribute('aria-label')) || undefined,
      });
    } catch {
      // Skip elements that error
    }
  }

  // Combine all interactive elements
  const visibleElements = [...buttons, ...links, ...inputs].slice(0, 50);

  // Get alerts/errors
  const alerts: string[] = [];
  const alertLocators = page.locator('[role="alert"]:visible, .alert:visible, .toast:visible');
  const alertCount = await alertLocators.count();
  for (let i = 0; i < Math.min(alertCount, 5); i++) {
    const text = await safeGetText(alertLocators.nth(i));
    if (text) alerts.push(text.trim());
  }

  // Get error messages
  const errorMessages: string[] = [];
  const errorLocators = page.locator('.error:visible, .error-message:visible, .text-red-500:visible, .text-destructive:visible');
  const errorCount = await errorLocators.count();
  for (let i = 0; i < Math.min(errorCount, 5); i++) {
    const text = await safeGetText(errorLocators.nth(i));
    if (text) errorMessages.push(text.trim());
  }

  // Count loading indicators
  const loadingIndicators = await page.locator('.loading:visible, .spinner:visible, [aria-busy="true"]:visible, .animate-spin:visible').count();

  // Get modals
  const modals: { title: string; isOpen: boolean }[] = [];
  const modalLocators = page.locator('[role="dialog"]:visible, .modal:visible');
  const modalCount = await modalLocators.count();
  for (let i = 0; i < Math.min(modalCount, 3); i++) {
    const modal = modalLocators.nth(i);
    const modalTitle = await safeGetText(modal.locator('h2, h3, [role="heading"]').first());
    modals.push({ title: modalTitle || 'Untitled Modal', isOpen: true });
  }

  // Get breadcrumbs
  const breadcrumbs: string[] = [];
  const breadcrumbLocators = page.locator('nav[aria-label="breadcrumb"] a, .breadcrumb a');
  const breadcrumbCount = await breadcrumbLocators.count();
  for (let i = 0; i < Math.min(breadcrumbCount, 5); i++) {
    const text = await safeGetText(breadcrumbLocators.nth(i));
    if (text) breadcrumbs.push(text.trim());
  }

  // Get navigation links
  const navigation: { text: string; href: string; isActive: boolean }[] = [];
  const navLocators = page.locator('nav a:visible, header a:visible');
  const navCount = await navLocators.count();
  for (let i = 0; i < Math.min(navCount, 15); i++) {
    const navLink = navLocators.nth(i);
    try {
      const text = ((await navLink.textContent()) || '').trim();
      const href = (await navLink.getAttribute('href')) || '';
      const ariaCurrent = await navLink.getAttribute('aria-current');
      navigation.push({
        text,
        href,
        isActive: ariaCurrent === 'page',
      });
    } catch {
      // Skip elements that error
    }
  }

  // Get forms (simplified)
  const forms: FormState[] = [];
  const formLocators = page.locator('form:visible');
  const formCount = await formLocators.count();
  for (let i = 0; i < Math.min(formCount, 3); i++) {
    forms.push({
      id: `form-${i}`,
      fields: [],
      isValid: true,
      hasErrors: false,
      errorMessages: [],
    });
  }

  return {
    url,
    title,
    heading,
    visibleElements,
    forms,
    alerts,
    errorMessages,
    loadingIndicators,
    modals,
    breadcrumbs,
    navigation,
  };
}

/**
 * Wait for page to be stable (no loading indicators, network idle)
 */
export async function waitForPageStable(page: Page, timeout: number = 10000): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch {
    // Continue even if network doesn't become idle
  }

  // Wait for any loading indicators to disappear
  try {
    await page
      .locator('.loading, .spinner, [aria-busy="true"], .animate-spin')
      .first()
      .waitFor({ state: 'hidden', timeout: 3000 });
  } catch {
    // Ignore if no loading indicators found or timeout
  }
}

/**
 * Extract visible text content for AI analysis
 */
export async function extractVisibleText(page: Page, maxLength: number = 2000): Promise<string> {
  try {
    const bodyText = await page.locator('body').textContent();
    return (bodyText || '').slice(0, maxLength);
  } catch {
    return '';
  }
}

/**
 * Check if page has any blocking errors
 */
export async function hasBlockingErrors(page: Page): Promise<{ hasErrors: boolean; errors: string[] }> {
  const context = await analyzePageContext(page);

  const blockingPatterns = [
    /error/i,
    /failed/i,
    /not found/i,
    /unauthorized/i,
    /forbidden/i,
    /500/,
    /503/,
    /internal server/i,
  ];

  const errors = context.errorMessages.filter((msg) => blockingPatterns.some((pattern) => pattern.test(msg)));

  return {
    hasErrors: errors.length > 0,
    errors,
  };
}
