/**
 * Base UAT Agent
 *
 * Abstract base class for all UAT testing agents.
 * Provides core capabilities for page interaction, evidence capture,
 * error detection, and AI-driven decision making.
 */

import type { Page, BrowserContext, Locator } from '@playwright/test';
import { uatConfig, type PersonaConfig, type FlowConfig } from '../config';
import type { PageContext } from '../context/page-analyzer';
import type { DetectedError } from '../detection/error-types';

export interface ActionRecord {
  timestamp: number;
  action: string;
  target?: string;
  value?: string;
  result: 'success' | 'failure' | 'skipped';
  duration: number;
  screenshot?: string;
  error?: string;
}

export interface AgentSession {
  id: string;
  personaId: string;
  startTime: number;
  endTime?: number;
  currentUrl: string;
  actions: ActionRecord[];
  errors: DetectedError[];
  screenshots: string[];
  goalsCompleted: string[];
  goalsPending: string[];
}

export interface AgentDecision {
  action: ActionType;
  target?: string;
  value?: string;
  reasoning: string;
  confidence: number;
  shouldContinue?: boolean;
}

export type ActionType =
  | 'click'
  | 'fill'
  | 'select'
  | 'navigate'
  | 'scroll'
  | 'wait'
  | 'screenshot'
  | 'assert'
  | 'complete';

/**
 * Abstract base class for UAT agents
 */
export abstract class BaseAgent {
  protected page: Page;
  protected context: BrowserContext;
  protected persona: PersonaConfig;
  protected session: AgentSession;
  protected consoleErrors: string[] = [];
  protected networkErrors: { url: string; status: number; message: string }[] = [];

  constructor(page: Page, context: BrowserContext, persona: PersonaConfig) {
    this.page = page;
    this.context = context;
    this.persona = persona;
    this.session = this.initSession();

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Initialize a new session
   */
  private initSession(): AgentSession {
    return {
      id: `uat_${this.persona.id}_${Date.now()}`,
      personaId: this.persona.id,
      startTime: Date.now(),
      currentUrl: '',
      actions: [],
      errors: [],
      screenshots: [],
      goalsCompleted: [],
      goalsPending: [...this.persona.goals],
    };
  }

  /**
   * Set up page event listeners for error detection
   */
  private setupEventListeners(): void {
    // Console errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.consoleErrors.push(msg.text());
      }
    });

    // Page errors (uncaught exceptions)
    this.page.on('pageerror', (error) => {
      this.consoleErrors.push(error.message);
      this.recordError({
        id: `err_${Date.now()}`,
        category: 'functional',
        severity: 'high',
        title: 'Uncaught Page Error',
        description: error.message,
        url: this.page.url(),
        timestamp: Date.now(),
        evidence: {
          consoleOutput: error.stack || error.message,
        },
      });
    });

    // Network failures
    this.page.on('response', (response) => {
      if (response.status() >= 400) {
        this.networkErrors.push({
          url: response.url(),
          status: response.status(),
          message: response.statusText(),
        });

        if (response.status() >= 500) {
          this.recordError({
            id: `err_${Date.now()}`,
            category: 'functional',
            severity: 'critical',
            title: `Server Error: ${response.status()}`,
            description: `${response.statusText()} at ${response.url()}`,
            url: this.page.url(),
            timestamp: Date.now(),
            evidence: {
              requestUrl: response.url(),
              statusCode: response.status(),
            },
          });
        }
      }
    });

    // Request failures
    this.page.on('requestfailed', (request) => {
      this.networkErrors.push({
        url: request.url(),
        status: 0,
        message: request.failure()?.errorText || 'Request failed',
      });
    });
  }

  // ============================================================================
  // Core Navigation & Interaction
  // ============================================================================

  /**
   * Navigate to a URL with retry logic
   */
  async navigateTo(url: string): Promise<void> {
    const startTime = Date.now();
    const fullUrl = url.startsWith('http') ? url : `${uatConfig.baseUrl}${url}`;

    for (let attempt = 1; attempt <= uatConfig.retry.maxRetries; attempt++) {
      try {
        const response = await this.page.goto(fullUrl, {
          waitUntil: 'networkidle',
          timeout: uatConfig.timeout,
        });

        if (response?.status() === 429) {
          // Rate limited - wait and retry
          await this.page.waitForTimeout(uatConfig.retry.retryDelay * attempt);
          continue;
        }

        this.session.currentUrl = this.page.url();
        this.recordAction({
          action: 'navigate',
          target: url,
          result: 'success',
          duration: Date.now() - startTime,
        });
        return;
      } catch (error) {
        if (attempt === uatConfig.retry.maxRetries) {
          this.recordAction({
            action: 'navigate',
            target: url,
            result: 'failure',
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
        await this.page.waitForTimeout(uatConfig.retry.retryDelay);
      }
    }
  }

  /**
   * Click an element
   */
  async click(selector: string, options?: { text?: string | RegExp }): Promise<void> {
    const startTime = Date.now();
    try {
      let locator: Locator;

      if (options?.text) {
        locator = this.page.locator(selector, { hasText: options.text });
      } else {
        locator = this.page.locator(selector);
      }

      await locator.first().click({ timeout: uatConfig.timeout });

      this.recordAction({
        action: 'click',
        target: selector,
        value: options?.text?.toString(),
        result: 'success',
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.recordAction({
        action: 'click',
        target: selector,
        result: 'failure',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Click a button by text
   */
  async clickButton(text: string | RegExp): Promise<void> {
    const startTime = Date.now();
    try {
      await this.page.getByRole('button', { name: text }).click({ timeout: uatConfig.timeout });
      this.recordAction({
        action: 'click',
        target: 'button',
        value: text.toString(),
        result: 'success',
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.recordAction({
        action: 'click',
        target: 'button',
        value: text.toString(),
        result: 'failure',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Click a link by text
   */
  async clickLink(text: string | RegExp): Promise<void> {
    const startTime = Date.now();
    try {
      await this.page.getByRole('link', { name: text }).click({ timeout: uatConfig.timeout });
      this.recordAction({
        action: 'click',
        target: 'link',
        value: text.toString(),
        result: 'success',
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.recordAction({
        action: 'click',
        target: 'link',
        value: text.toString(),
        result: 'failure',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Fill an input by label
   */
  async fillInput(label: string, value: string): Promise<void> {
    const startTime = Date.now();
    try {
      const input = this.page.getByLabel(label);
      await input.clear();
      await input.fill(value);
      this.recordAction({
        action: 'fill',
        target: label,
        value,
        result: 'success',
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.recordAction({
        action: 'fill',
        target: label,
        result: 'failure',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Fill a form with multiple fields
   */
  async fillForm(fields: Record<string, string>): Promise<void> {
    for (const [label, value] of Object.entries(fields)) {
      await this.fillInput(label, value);

      // Add realistic delay between fields based on persona
      const delay =
        this.persona.behaviorProfile.formFillSpeed === 'fast'
          ? 100
          : this.persona.behaviorProfile.formFillSpeed === 'realistic'
            ? 300
            : 500;
      await this.page.waitForTimeout(delay);
    }
  }

  /**
   * Select an option from a dropdown
   */
  async selectOption(label: string, optionText: string): Promise<void> {
    const startTime = Date.now();
    try {
      await this.page.getByLabel(label).selectOption({ label: optionText });
      this.recordAction({
        action: 'select',
        target: label,
        value: optionText,
        result: 'success',
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.recordAction({
        action: 'select',
        target: label,
        result: 'failure',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Wait for an element to be visible
   */
  async waitForVisible(selector: string, options?: { text?: string }): Promise<void> {
    const locator = options?.text
      ? this.page.locator(selector, { hasText: options.text })
      : this.page.locator(selector);

    await locator.first().waitFor({ state: 'visible', timeout: uatConfig.timeout });
  }

  /**
   * Assert that text is visible on the page
   */
  async assertVisible(text: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      await this.page.getByText(text).first().waitFor({ state: 'visible', timeout: uatConfig.timeout });
      this.recordAction({
        action: 'assert',
        target: 'text',
        value: text,
        result: 'success',
        duration: Date.now() - startTime,
      });
      return true;
    } catch {
      this.recordAction({
        action: 'assert',
        target: 'text',
        value: text,
        result: 'failure',
        duration: Date.now() - startTime,
        error: `Text "${text}" not visible`,
      });
      return false;
    }
  }

  /**
   * Scroll the page
   */
  async scroll(direction: 'up' | 'down', amount: number = 500): Promise<void> {
    const startTime = Date.now();
    await this.page.mouse.wheel(0, direction === 'down' ? amount : -amount);
    this.recordAction({
      action: 'scroll',
      target: direction,
      value: amount.toString(),
      result: 'success',
      duration: Date.now() - startTime,
    });
  }

  // ============================================================================
  // Evidence Capture
  // ============================================================================

  /**
   * Take a screenshot
   */
  async captureScreenshot(name: string): Promise<string> {
    const filename = `${this.session.id}_${name}_${Date.now()}.png`;
    const path = `${uatConfig.outputDir}/screenshots/${filename}`;

    await this.page.screenshot({ path, fullPage: false });
    this.session.screenshots.push(path);

    this.recordAction({
      action: 'screenshot',
      target: name,
      result: 'success',
      duration: 0,
      screenshot: path,
    });

    return path;
  }

  /**
   * Capture evidence for an error
   */
  async captureErrorEvidence(error: DetectedError): Promise<void> {
    const screenshotPath = await this.captureScreenshot(`error_${error.id}`);
    error.screenshot = screenshotPath;
  }

  // ============================================================================
  // Error Recording
  // ============================================================================

  /**
   * Record an action
   */
  protected recordAction(action: Omit<ActionRecord, 'timestamp'>): void {
    this.session.actions.push({
      ...action,
      timestamp: Date.now(),
    });
  }

  /**
   * Record a detected error
   */
  protected recordError(error: DetectedError): void {
    this.session.errors.push(error);
  }

  /**
   * Mark a goal as completed
   */
  protected completeGoal(goal: string): void {
    const index = this.session.goalsPending.indexOf(goal);
    if (index > -1) {
      this.session.goalsPending.splice(index, 1);
      this.session.goalsCompleted.push(goal);
    }
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Get current session state
   */
  getSession(): AgentSession {
    return this.session;
  }

  /**
   * End the session
   */
  endSession(): AgentSession {
    this.session.endTime = Date.now();
    return this.session;
  }

  /**
   * Get action count
   */
  getActionCount(): number {
    return this.session.actions.length;
  }

  /**
   * Check if max actions reached
   */
  hasReachedMaxActions(): boolean {
    return this.session.actions.length >= uatConfig.maxActionsPerFlow;
  }

  // ============================================================================
  // Abstract Methods (to be implemented by specific agents)
  // ============================================================================

  /**
   * Run the agent's main flow
   */
  abstract run(): Promise<AgentSession>;

  /**
   * Execute a specific flow
   */
  abstract executeFlow(flow: FlowConfig): Promise<void>;

  /**
   * Make an AI-driven decision about what to do next
   */
  abstract decide(pageContext: PageContext): Promise<AgentDecision>;
}

/**
 * Generate test data based on persona
 */
export function generateTestData(persona: PersonaConfig): Record<string, string> {
  const baseData = {
    firstName: `Test${persona.name}`,
    lastName: 'User',
    email: `test-${persona.id}@nexvigilant.com`,
    company: 'Test Organization',
    phone: '555-123-4567',
    title: 'Test Engineer',
  };

  // Add role-specific data
  switch (persona.role) {
    case 'admin':
      return {
        ...baseData,
        title: 'Platform Administrator',
        company: 'AlgoVigilance',
      };
    case 'practitioner':
      return {
        ...baseData,
        title: 'PV Specialist',
        yearsExperience: '5',
      };
    case 'member':
      return {
        ...baseData,
        title: 'PV Associate',
        yearsExperience: '2',
      };
    default:
      return baseData;
  }
}
