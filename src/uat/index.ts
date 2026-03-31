#!/usr/bin/env npx tsx
/**
 * UAT Agent CLI
 *
 * Entry point for running UAT agents.
 *
 * Usage:
 *   npm run uat                        # Run all agents
 *   npm run uat -- --persona=visitor   # Run specific persona
 *   npm run uat -- --flow=service-wizard  # Run specific flow
 *   npm run uat -- --headed            # Show browser
 */

import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { uatConfig, personas, type PersonaConfig, type FlowId } from './config';
import { VisitorAgent } from './agents/visitor-agent';
import type { AgentSession } from './agents/base-agent';
// import { generateReport, writeReport, printReportSummary } from './reports/generator';

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CLIOptions {
  persona?: string;
  flow?: FlowId;
  headed?: boolean;
  all?: boolean;
  help?: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--headed') {
      options.headed = true;
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg.startsWith('--persona=')) {
      options.persona = arg.split('=')[1];
    } else if (arg.startsWith('--flow=')) {
      options.flow = arg.split('=')[1] as FlowId;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
UAT Agent CLI
=============

Usage:
  npm run uat [options]

Options:
  --help, -h           Show this help message
  --persona=<name>     Run a specific persona (visitor, member, practitioner, admin)
  --flow=<id>          Run a specific flow only
  --headed             Show browser window (default: headless)
  --all                Run all personas (default if no persona specified)

Examples:
  npm run uat                           # Run all personas
  npm run uat -- --persona=visitor      # Run visitor persona only
  npm run uat -- --flow=service-wizard  # Run service wizard flow
  npm run uat -- --headed               # Run with visible browser

Available Personas:
  - visitor      Anonymous user testing public pages and wizard
  - member       New member testing onboarding and basic features
  - practitioner Active user testing academy and community
  - admin        Administrator testing admin dashboard

Available Flows:
  - service-wizard   5-step strategic assessment
  - public-pages     All public marketing pages
  - onboarding       4-step member onboarding
  - academy          Learning pathways (placeholder)
  - community        Discussion forums (placeholder)
  - admin            Admin dashboard (placeholder)
`);
}

// ============================================================================
// Agent Runner
// ============================================================================

async function createAgent(
  page: Page,
  context: BrowserContext,
  persona: PersonaConfig
): Promise<{ run: () => Promise<AgentSession> }> {
  // Currently only visitor is implemented
  switch (persona.id) {
    case 'visitor':
      return new VisitorAgent(page, context, persona);
    default:
      // For unimplemented personas, use visitor as base
      console.log(`⚠️  Persona "${persona.id}" not fully implemented, using visitor agent`);
      return new VisitorAgent(page, context, persona);
  }
}

async function runPersona(
  browser: Browser,
  persona: PersonaConfig,
  flowFilter?: FlowId
): Promise<AgentSession> {
  // Apply flow filter if specified
  const filteredPersona = flowFilter
    ? {
        ...persona,
        targetFlows: persona.targetFlows.filter((f) => f === flowFilter),
      }
    : persona;

  if (flowFilter && filteredPersona.targetFlows.length === 0) {
    console.log(`\n⚠️  Flow "${flowFilter}" not available for persona "${persona.name}"`);
    console.log(`   Available flows: ${persona.targetFlows.join(', ')}`);
    throw new Error(`Flow "${flowFilter}" not in persona's target flows`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Starting persona: ${filteredPersona.name} (${filteredPersona.id})`);
  if (flowFilter) {
    console.log(`Flow filter: ${flowFilter}`);
  }
  console.log(`${'='.repeat(60)}`);

  const context = await browser.newContext({
    viewport: uatConfig.viewport,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 UAT-Agent',
    recordVideo: uatConfig.videoRecording
      ? { dir: `${uatConfig.outputDir}/videos`, size: uatConfig.viewport }
      : undefined,
  });

  const page = await context.newPage();

  try {
    const agent = await createAgent(page, context, filteredPersona);
    const session = await agent.run();
    return session;
  } finally {
    await context.close();
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    UAT Agent System                          ║
║              AI-Powered User Acceptance Testing              ║
╚══════════════════════════════════════════════════════════════╝
`);

  console.log(`Configuration:`);
  console.log(`  Base URL: ${uatConfig.baseUrl}`);
  console.log(`  Headless: ${options.headed ? 'No' : 'Yes'}`);
  console.log(`  Output: ${uatConfig.outputDir}`);

  // Determine which personas to run
  let personasToRun: PersonaConfig[];

  if (options.persona) {
    const persona = personas[options.persona];
    if (!persona) {
      console.error(`\n❌ Unknown persona: ${options.persona}`);
      console.log(`   Available: ${Object.keys(personas).join(', ')}`);
      process.exit(1);
    }
    personasToRun = [persona];
  } else {
    // Default: run visitor only for quick tests
    personasToRun = [personas.visitor];
  }

  console.log(`\nPersonas to run: ${personasToRun.map((p) => p.name).join(', ')}`);

  // Launch browser
  const browser = await chromium.launch({
    headless: !options.headed,
    slowMo: uatConfig.slowMo,
  });

  const sessions: AgentSession[] = [];

  try {
    // Run each persona
    for (const persona of personasToRun) {
      try {
        const session = await runPersona(browser, persona, options.flow);
        sessions.push(session);
      } catch (error) {
        console.error(`\n❌ Persona ${persona.name} failed:`, error);
      }
    }

    /*
    // Generate report
    if (sessions.length > 0) {
      const report = generateReport(sessions);
      printReportSummary(report);
      const reportPath = writeReport(report);

      console.log(`\n📂 Full report: ${reportPath}`);

      // Exit with error code if critical issues found
      if (report.summary.criticalErrors > 0) {
        console.log('\n⚠️  Critical issues detected!');
        process.exit(1);
      }
    } else {
      console.log('\n⚠️  No sessions completed successfully');
      process.exit(1);
    }
    */
    if (sessions.length === 0) {
      console.log('\n⚠️  No sessions completed successfully');
      process.exit(1);
    }
  } finally {
    await browser.close();
  }

  console.log('\n✅ UAT complete!\n');
}

// Run if executed directly
main().catch((error) => {
  console.error('\n❌ UAT failed:', error);
  process.exit(1);
});
