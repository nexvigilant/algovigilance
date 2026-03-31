/**
 * Error Detection Strategies
 *
 * Various strategies for detecting errors during UAT sessions.
 */

import type { Page } from '@playwright/test';
import { createError, type DetectedError, type ErrorCategory, type Severity } from './error-types';
import type { PageContext } from '../context/page-analyzer';

// ============================================================================
// Detection Strategy Interface
// ============================================================================

export interface DetectionStrategy {
  name: string;
  category: ErrorCategory;
  detect(page: Page, context: PageContext): Promise<DetectedError[]>;
}

// ============================================================================
// Console Error Strategy
// ============================================================================

export class ConsoleErrorStrategy implements DetectionStrategy {
  name = 'Console Errors';
  category: ErrorCategory = 'functional';
  private errors: string[] = [];

  /**
   * Set up console listener (call once per page)
   */
  setupListener(page: Page): void {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      this.errors.push(error.message);
    });
  }

  async detect(_page: Page, context: PageContext): Promise<DetectedError[]> {
    const detectedErrors: DetectedError[] = [];

    for (const errorText of this.errors) {
      // Skip known benign errors
      if (this.isBenignError(errorText)) continue;

      detectedErrors.push(
        createError({
          category: 'functional',
          type: 'api_error',
          title: 'Console Error',
          description: errorText.slice(0, 200),
          url: context.url,
          evidence: { consoleOutput: errorText },
          severity: this.getSeverity(errorText),
        })
      );
    }

    // Clear errors after detection
    this.errors = [];

    return detectedErrors;
  }

  private isBenignError(error: string): boolean {
    const benignPatterns = [
      /Failed to load resource.*favicon/i,
      /Blocked loading mixed active content/i,
      /ResizeObserver loop/i,
      /hydration/i, // React hydration warnings
    ];
    return benignPatterns.some((pattern) => pattern.test(error));
  }

  private getSeverity(error: string): Severity {
    if (/uncaught|exception|fatal/i.test(error)) return 'critical';
    if (/error|failed/i.test(error)) return 'high';
    return 'medium';
  }
}

// ============================================================================
// Network Error Strategy
// ============================================================================

export class NetworkErrorStrategy implements DetectionStrategy {
  name = 'Network Errors';
  category: ErrorCategory = 'functional';
  private networkErrors: { url: string; status: number; message: string }[] = [];

  /**
   * Set up network listener (call once per page)
   */
  setupListener(page: Page): void {
    page.on('response', (response) => {
      if (response.status() >= 400) {
        this.networkErrors.push({
          url: response.url(),
          status: response.status(),
          message: response.statusText(),
        });
      }
    });

    page.on('requestfailed', (request) => {
      this.networkErrors.push({
        url: request.url(),
        status: 0,
        message: request.failure()?.errorText || 'Request failed',
      });
    });
  }

  async detect(_page: Page, context: PageContext): Promise<DetectedError[]> {
    const detectedErrors: DetectedError[] = [];

    for (const error of this.networkErrors) {
      // Skip known benign failures
      if (this.isBenignError(error)) continue;

      const severity = this.getSeverity(error.status);

      detectedErrors.push(
        createError({
          category: 'functional',
          type: error.status >= 500 ? 'api_error' : 'broken_link',
          title: `Network Error: ${error.status || 'Failed'}`,
          description: `${error.message} at ${error.url}`,
          url: context.url,
          evidence: {
            networkRequest: {
              url: error.url,
              method: 'GET',
              status: error.status,
            },
          },
          severity,
        })
      );
    }

    // Clear after detection
    this.networkErrors = [];

    return detectedErrors;
  }

  private isBenignError(error: { url: string; status: number }): boolean {
    // Ignore analytics, tracking, and known external services
    const benignPatterns = [
      /analytics/i,
      /google.*tag/i,
      /facebook/i,
      /twitter/i,
      /favicon/i,
      /\.map$/,
    ];
    return benignPatterns.some((pattern) => pattern.test(error.url));
  }

  private getSeverity(status: number): Severity {
    if (status >= 500) return 'critical';
    if (status === 404) return 'medium';
    if (status >= 400) return 'high';
    return 'high'; // Request failed entirely
  }
}

// ============================================================================
// Loading Timeout Strategy
// ============================================================================

export class LoadingTimeoutStrategy implements DetectionStrategy {
  name = 'Loading Timeouts';
  category: ErrorCategory = 'performance';

  async detect(page: Page, context: PageContext): Promise<DetectedError[]> {
    const detectedErrors: DetectedError[] = [];

    // Check for stuck loading indicators
    if (context.loadingIndicators > 0) {
      // Wait a bit and check again
      await page.waitForTimeout(3000);

      const stillLoading = await page.locator('.loading, .spinner, [aria-busy="true"], .animate-spin').count();

      if (stillLoading > 0) {
        detectedErrors.push(
          createError({
            category: 'performance',
            type: 'slow_response',
            title: 'Persistent Loading State',
            description: `Page has ${stillLoading} loading indicator(s) that haven't resolved`,
            url: context.url,
            severity: 'medium',
          })
        );
      }
    }

    return detectedErrors;
  }
}

// ============================================================================
// Form Validation Strategy
// ============================================================================

export class FormValidationStrategy implements DetectionStrategy {
  name = 'Form Validation';
  category: ErrorCategory = 'ux';

  async detect(_page: Page, context: PageContext): Promise<DetectedError[]> {
    const detectedErrors: DetectedError[] = [];

    for (const form of context.forms) {
      // Check for unclear error messages
      for (const errorMsg of form.errorMessages) {
        if (this.isUnclearErrorMessage(errorMsg)) {
          detectedErrors.push(
            createError({
              category: 'ux',
              type: 'unclear_error_message',
              title: 'Unclear Form Error',
              description: `Error message "${errorMsg}" may be confusing to users`,
              url: context.url,
              evidence: { errorMessage: errorMsg, formId: form.id },
              severity: 'low',
            })
          );
        }
      }

      // Check for missing labels
      const unlabeledFields = form.fields.filter((f) => !f.label && f.required);
      if (unlabeledFields.length > 0) {
        detectedErrors.push(
          createError({
            category: 'accessibility',
            type: 'missing_labels',
            title: 'Form Fields Missing Labels',
            description: `${unlabeledFields.length} required field(s) have no visible label`,
            url: context.url,
            evidence: { fields: unlabeledFields.map((f) => f.name) },
            severity: 'medium',
          })
        );
      }
    }

    return detectedErrors;
  }

  private isUnclearErrorMessage(message: string): boolean {
    const unclearPatterns = [
      /^error$/i,
      /^invalid$/i,
      /^required$/i,
      /^failed$/i,
      /^\w{1,3}$/, // Very short messages
    ];
    return unclearPatterns.some((pattern) => pattern.test(message.trim()));
  }
}

// ============================================================================
// Empty State Strategy
// ============================================================================

export class EmptyStateStrategy implements DetectionStrategy {
  name = 'Empty States';
  category: ErrorCategory = 'ux';

  async detect(page: Page, context: PageContext): Promise<DetectedError[]> {
    const detectedErrors: DetectedError[] = [];

    // Check for empty content areas
    const emptyContainers = await page.locator('main:empty, [data-content]:empty, .content:empty').count();

    if (emptyContainers > 0 && context.loadingIndicators === 0) {
      detectedErrors.push(
        createError({
          category: 'ux',
          type: 'empty_state_unclear',
          title: 'Empty Content Area',
          description: `Page has ${emptyContainers} empty content area(s) with no loading indicator or explanation`,
          url: context.url,
          severity: 'medium',
        })
      );
    }

    return detectedErrors;
  }
}

// ============================================================================
// Broken Image Strategy
// ============================================================================

export class BrokenImageStrategy implements DetectionStrategy {
  name = 'Broken Images';
  category: ErrorCategory = 'content';

  async detect(page: Page, context: PageContext): Promise<DetectedError[]> {
    const detectedErrors: DetectedError[] = [];

    const brokenImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images
        .filter((img) => !img.complete || img.naturalHeight === 0)
        .map((img) => ({
          src: img.src,
          alt: img.alt,
        }));
    });

    for (const img of brokenImages) {
      detectedErrors.push(
        createError({
          category: 'content',
          type: 'broken_image',
          title: 'Broken Image',
          description: `Image failed to load: ${img.src}`,
          url: context.url,
          evidence: { imageSrc: img.src, altText: img.alt },
          severity: 'low',
        })
      );
    }

    return detectedErrors;
  }
}

// ============================================================================
// Accessibility Strategy (Basic)
// ============================================================================

export class BasicAccessibilityStrategy implements DetectionStrategy {
  name = 'Basic Accessibility';
  category: ErrorCategory = 'accessibility';

  async detect(page: Page, context: PageContext): Promise<DetectedError[]> {
    const detectedErrors: DetectedError[] = [];

    // Check for images without alt text
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    if (imagesWithoutAlt > 0) {
      detectedErrors.push(
        createError({
          category: 'accessibility',
          type: 'missing_alt_text',
          title: 'Images Missing Alt Text',
          description: `${imagesWithoutAlt} image(s) have no alt attribute`,
          url: context.url,
          severity: 'medium',
        })
      );
    }

    // Check for buttons/links without accessible names
    const inaccessibleButtons = await page.locator('button:not([aria-label]):empty').count();
    if (inaccessibleButtons > 0) {
      detectedErrors.push(
        createError({
          category: 'accessibility',
          type: 'missing_labels',
          title: 'Buttons Without Accessible Names',
          description: `${inaccessibleButtons} button(s) have no text or aria-label`,
          url: context.url,
          severity: 'medium',
        })
      );
    }

    return detectedErrors;
  }
}

// ============================================================================
// Strategy Manager
// ============================================================================

export class DetectionManager {
  private strategies: DetectionStrategy[] = [];
  private consoleStrategy = new ConsoleErrorStrategy();
  private networkStrategy = new NetworkErrorStrategy();

  constructor() {
    this.strategies = [
      new LoadingTimeoutStrategy(),
      new FormValidationStrategy(),
      new EmptyStateStrategy(),
      new BrokenImageStrategy(),
      new BasicAccessibilityStrategy(),
    ];
  }

  /**
   * Set up page listeners for continuous monitoring
   */
  setupListeners(page: Page): void {
    this.consoleStrategy.setupListener(page);
    this.networkStrategy.setupListener(page);
  }

  /**
   * Run all detection strategies on current page
   */
  async detectAll(page: Page, context: PageContext): Promise<DetectedError[]> {
    const allErrors: DetectedError[] = [];

    // Run console and network strategies first
    const [consoleErrors, networkErrors] = await Promise.all([
      this.consoleStrategy.detect(page, context),
      this.networkStrategy.detect(page, context),
    ]);

    allErrors.push(...consoleErrors, ...networkErrors);

    // Run remaining strategies
    for (const strategy of this.strategies) {
      try {
        const errors = await strategy.detect(page, context);
        allErrors.push(...errors);
      } catch (error) {
        console.error(`Strategy ${strategy.name} failed:`, error);
      }
    }

    return allErrors;
  }

  /**
   * Run specific category of detection
   */
  async detectByCategory(
    page: Page,
    context: PageContext,
    category: ErrorCategory
  ): Promise<DetectedError[]> {
    const strategyForCategory = this.strategies.filter((s) => s.category === category);
    const errors: DetectedError[] = [];

    for (const strategy of strategyForCategory) {
      try {
        const detected = await strategy.detect(page, context);
        errors.push(...detected);
      } catch (error) {
        console.error(`Strategy ${strategy.name} failed:`, error);
      }
    }

    return errors;
  }
}
