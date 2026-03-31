/**
 * Visitor Agent (Jordan)
 *
 * Simulates an anonymous visitor exploring the platform.
 * Tests public pages and service wizard without authentication.
 */

import type { Page, BrowserContext } from '@playwright/test';
import { BaseAgent, type AgentSession, type AgentDecision } from './base-agent';
import { personas, getFlowConfig, type FlowConfig } from '../config';
import { analyzePageContext, waitForPageStable, type PageContext } from '../context/page-analyzer';
import { makeAgentDecision, prepareDecisionInput } from '../ai/decision-flow';
import { DetectionManager } from '../detection/strategies';
import { executeFlow } from '../flows';
import type { ErrorCategory } from '../detection/error-types';

/**
 * Visitor Agent - Tests public-facing functionality
 */
export class VisitorAgent extends BaseAgent {
  private detectionManager: DetectionManager;
  private currentFlowIndex = 0;

  constructor(page: Page, context: BrowserContext, persona?: typeof personas.visitor) {
    super(page, context, persona || personas.visitor);
    this.detectionManager = new DetectionManager();
    this.detectionManager.setupListeners(page);
  }

  /**
   * Run the visitor agent's complete test session
   */
  async run(): Promise<AgentSession> {
    console.log(`\n🧑 Starting Visitor Agent (${this.persona.name})`);
    console.log(`   Goals: ${this.persona.goals.join(', ')}`);

    try {
      // Execute each target flow
      for (const flowId of this.persona.targetFlows) {
        const flowConfig = getFlowConfig(flowId);
        console.log(`\n📋 Executing flow: ${flowConfig.name}`);

        await this.executeFlow(flowConfig);

        // Check for errors after each flow
        const context = await analyzePageContext(this.page);
        const errors = await this.detectionManager.detectAll(this.page, context);
        for (const error of errors) {
          this.recordError(error);
        }

        // Mark goal as complete if flow succeeded
        const matchingGoal = this.persona.goals.find(
          (g) => g.toLowerCase().includes(flowId.toLowerCase()) || flowId.includes(g.toLowerCase().split(' ')[0])
        );
        if (matchingGoal) {
          this.completeGoal(matchingGoal);
        }

        this.currentFlowIndex++;
      }

      // Perform some exploratory testing
      await this.exploreWithAI();

      console.log(`\n✅ Visitor Agent completed`);
      console.log(`   Actions: ${this.session.actions.length}`);
      console.log(`   Errors: ${this.session.errors.length}`);
      console.log(`   Goals: ${this.session.goalsCompleted.length}/${this.persona.goals.length}`);
    } catch (error) {
      console.error(`\n❌ Visitor Agent failed:`, error);
    }

    return this.endSession();
  }

  /**
   * Execute a specific flow
   */
  async executeFlow(flow: FlowConfig): Promise<void> {
    const result = await executeFlow(flow.id, this, this.page, flow);

    if (!result.completed) {
      console.log(`   ⚠️ Flow incomplete: ${result.errors.join(', ')}`);
    }
  }

  /**
   * Make AI-driven decisions for exploratory testing
   */
  async decide(pageContext: PageContext): Promise<AgentDecision> {
    const input = prepareDecisionInput({
      persona: this.persona,
      pageContext,
      actionHistory: this.session.actions,
      remainingGoals: this.session.goalsPending,
      currentGoal: this.session.goalsPending[0],
      actionsRemaining: 50 - this.getActionCount(),
    });

    const decision = await makeAgentDecision(input);

    // Record any AI-detected issues
    for (const issue of decision.detectedIssues) {
      this.recordError({
        id: `ai_${Date.now()}`,
        category: issue.type as ErrorCategory,
        severity: issue.severity,
        title: `AI Detected: ${issue.type}`,
        description: issue.description,
        url: pageContext.url,
        timestamp: Date.now(),
        evidence: {},
        aiConfidence: decision.confidenceScore,
      });
    }

    return {
      action: decision.nextAction.type,
      target: decision.nextAction.target,
      value: decision.nextAction.value,
      reasoning: decision.nextAction.reasoning,
      confidence: decision.confidenceScore,
      shouldContinue: decision.shouldContinue,
    };
  }

  /**
   * Perform exploratory testing with AI guidance
   */
  private async exploreWithAI(): Promise<void> {
    console.log(`\n🔍 Starting AI-guided exploration`);

    let explorationCount = 0;
    const maxExplorations = 10;

    while (explorationCount < maxExplorations && !this.hasReachedMaxActions()) {
      try {
        await waitForPageStable(this.page);
        const context = await analyzePageContext(this.page);

        // Get AI decision
        const decision = await this.decide(context);

        if (!decision.shouldContinue || decision.action === 'complete') {
          console.log(`   AI decided to stop: ${decision.reasoning}`);
          break;
        }

        // Execute the decision
        await this.executeDecision(decision);
        explorationCount++;

        // Run detection after each action
        const errors = await this.detectionManager.detectAll(this.page, context);
        for (const error of errors) {
          this.recordError(error);
        }
      } catch (error) {
        console.log(`   Exploration step failed: ${error}`);
        explorationCount++;
      }
    }

    console.log(`   Exploration completed (${explorationCount} steps)`);
  }

  /**
   * Execute an AI decision
   */
  private async executeDecision(decision: AgentDecision): Promise<void> {
    switch (decision.action) {
      case 'click':
        if (decision.target) {
          await this.click(decision.target);
        }
        break;
      case 'fill':
        if (decision.target && decision.value) {
          await this.fillInput(decision.target, decision.value);
        }
        break;
      case 'navigate':
        if (decision.target) {
          await this.navigateTo(decision.target);
        }
        break;
      case 'scroll':
        await this.scroll(decision.value === 'up' ? 'up' : 'down');
        break;
      case 'screenshot':
        await this.captureScreenshot(decision.target || 'exploration');
        break;
      case 'wait':
        await this.page.waitForTimeout(1000);
        break;
      default:
        break;
    }
  }
}

/**
 * Create and run a visitor agent
 */
export async function runVisitorAgent(page: Page, context: BrowserContext): Promise<AgentSession> {
  const agent = new VisitorAgent(page, context);
  return agent.run();
}
