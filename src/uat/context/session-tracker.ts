/**
 * Session Tracker
 *
 * Tracks the history of actions taken during a UAT session
 * for analysis and reporting.
 */

import type { ActionRecord, AgentSession } from '../agents/base-agent';
import type { DetectedError } from '../detection/error-types';

export interface SessionSummary {
  sessionId: string;
  personaId: string;
  duration: number;
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  errorsDetected: number;
  goalsCompleted: number;
  goalsTotal: number;
  completionRate: number;
  averageActionDuration: number;
  screenshotsTaken: number;
}

/**
 * Calculate session summary statistics
 */
export function calculateSessionSummary(session: AgentSession): SessionSummary {
  const duration = (session.endTime || Date.now()) - session.startTime;
  const successfulActions = session.actions.filter((a) => a.result === 'success').length;
  const failedActions = session.actions.filter((a) => a.result === 'failure').length;
  const goalsTotal = session.goalsCompleted.length + session.goalsPending.length;

  const totalDuration = session.actions.reduce((sum, a) => sum + a.duration, 0);
  const averageActionDuration = session.actions.length > 0 ? totalDuration / session.actions.length : 0;

  return {
    sessionId: session.id,
    personaId: session.personaId,
    duration,
    totalActions: session.actions.length,
    successfulActions,
    failedActions,
    errorsDetected: session.errors.length,
    goalsCompleted: session.goalsCompleted.length,
    goalsTotal,
    completionRate: goalsTotal > 0 ? (session.goalsCompleted.length / goalsTotal) * 100 : 0,
    averageActionDuration,
    screenshotsTaken: session.screenshots.length,
  };
}

/**
 * Generate a timeline of actions for reporting
 */
export function generateActionTimeline(
  session: AgentSession
): { time: string; action: string; result: string; duration: string }[] {
  const startTime = session.startTime;

  return session.actions.map((action) => {
    const relativeTime = action.timestamp - startTime;
    const minutes = Math.floor(relativeTime / 60000);
    const seconds = Math.floor((relativeTime % 60000) / 1000);

    return {
      time: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      action: formatAction(action),
      result: action.result,
      duration: `${action.duration}ms`,
    };
  });
}

/**
 * Format an action for display
 */
function formatAction(action: ActionRecord): string {
  switch (action.action) {
    case 'navigate':
      return `Navigate to ${action.target}`;
    case 'click':
      return `Click ${action.target}${action.value ? ` (${action.value})` : ''}`;
    case 'fill':
      return `Fill "${action.target}" with "${action.value?.slice(0, 20)}..."`;
    case 'select':
      return `Select "${action.value}" in ${action.target}`;
    case 'scroll':
      return `Scroll ${action.target}`;
    case 'assert':
      return `Assert ${action.target}: "${action.value}"`;
    case 'screenshot':
      return `Screenshot: ${action.target}`;
    default:
      return action.action;
  }
}

/**
 * Identify patterns in errors
 */
export function analyzeErrorPatterns(errors: DetectedError[]): {
  repeatedUrls: { url: string; count: number }[];
  repeatedTypes: { type: string; count: number }[];
  temporalClusters: { timeRange: string; count: number }[];
} {
  // Count errors by URL
  const urlCounts = new Map<string, number>();
  for (const error of errors) {
    urlCounts.set(error.url, (urlCounts.get(error.url) || 0) + 1);
  }

  const repeatedUrls = Array.from(urlCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count);

  // Count errors by type
  const typeCounts = new Map<string, number>();
  for (const error of errors) {
    const key = error.type || error.category;
    typeCounts.set(key, (typeCounts.get(key) || 0) + 1);
  }

  const repeatedTypes = Array.from(typeCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Find temporal clusters (errors within 5 seconds of each other)
  const sortedErrors = [...errors].sort((a, b) => a.timestamp - b.timestamp);
  const clusters: { start: number; end: number; count: number }[] = [];

  let currentCluster: { start: number; end: number; count: number } | null = null;

  for (const error of sortedErrors) {
    if (!currentCluster || error.timestamp - currentCluster.end > 5000) {
      if (currentCluster && currentCluster.count > 1) {
        clusters.push(currentCluster);
      }
      currentCluster = { start: error.timestamp, end: error.timestamp, count: 1 };
    } else {
      currentCluster.end = error.timestamp;
      currentCluster.count++;
    }
  }

  if (currentCluster && currentCluster.count > 1) {
    clusters.push(currentCluster);
  }

  const temporalClusters = clusters.map((cluster) => ({
    timeRange: `${new Date(cluster.start).toISOString()} - ${new Date(cluster.end).toISOString()}`,
    count: cluster.count,
  }));

  return {
    repeatedUrls,
    repeatedTypes,
    temporalClusters,
  };
}

/**
 * Determine if session was successful based on goals and errors
 */
export function evaluateSessionSuccess(session: AgentSession): {
  success: boolean;
  score: number;
  reason: string;
} {
  const summary = calculateSessionSummary(session);

  // Critical failures
  const criticalErrors = session.errors.filter((e) => e.severity === 'critical');
  if (criticalErrors.length > 0) {
    return {
      success: false,
      score: 0,
      reason: `${criticalErrors.length} critical error(s) detected`,
    };
  }

  // Goal completion
  if (summary.completionRate < 50) {
    return {
      success: false,
      score: summary.completionRate,
      reason: `Only ${summary.completionRate.toFixed(0)}% of goals completed`,
    };
  }

  // High error rate
  const errorRate = summary.failedActions / (summary.totalActions || 1);
  if (errorRate > 0.3) {
    return {
      success: false,
      score: (1 - errorRate) * 100,
      reason: `High failure rate: ${(errorRate * 100).toFixed(0)}% of actions failed`,
    };
  }

  // Success with warnings
  const highErrors = session.errors.filter((e) => e.severity === 'high');
  if (highErrors.length > 0) {
    return {
      success: true,
      score: Math.max(70, summary.completionRate - highErrors.length * 5),
      reason: `Completed with ${highErrors.length} high-severity issue(s)`,
    };
  }

  // Full success
  return {
    success: true,
    score: summary.completionRate,
    reason: 'All goals completed successfully',
  };
}
