'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import {
  createOperationalNotification,
  notifyReviewNeeded as _notifyReviewNeeded,
  notifyMilestoneReached,
} from '@/app/nucleus/admin/academy/operations/notifications-actions';
import { getDomainAssignment } from '@/app/nucleus/admin/academy/operations/team-assignments-actions';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('operations/workflow-automation-actions');

// ============================================================================
// Workflow Rule Types
// ============================================================================

export type WorkflowTrigger =
  | 'content_generated'      // AI generates content
  | 'content_reviewed'       // Content reviewed (approved/rejected)
  | 'content_published'      // Content published
  | 'milestone_reached'      // Domain hits 25/50/75/100%
  | 'deadline_approaching'   // X days before deadline
  | 'deadline_passed'        // Deadline has passed
  | 'assignment_created'     // New assignment made
  | 'item_stale';            // No activity for X days

export type WorkflowAction =
  | 'notify_assignee'        // Notify the assigned team member
  | 'notify_admins'          // Notify all admins
  | 'notify_specific_user'   // Notify specific user
  | 'auto_assign_reviewer'   // Automatically assign a reviewer
  | 'escalate_to_admin'      // Escalate to admin attention
  | 'send_reminder'          // Send reminder notification
  | 'update_status'          // Update item status
  | 'create_task';           // Create a follow-up task

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowActionConfig[];
  enabled: boolean;
  priority: number; // Lower = higher priority
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: string | number | boolean;
}

export interface WorkflowActionConfig {
  action: WorkflowAction;
  params: Record<string, string | number | boolean>;
}

export interface WorkflowExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  trigger: WorkflowTrigger;
  triggerData: Record<string, unknown>;
  actionsExecuted: string[];
  status: 'success' | 'partial' | 'failed';
  error?: string;
  executedAt: string;
}

// ============================================================================
// Default Workflow Rules
// ============================================================================

const DEFAULT_WORKFLOW_RULES: Omit<WorkflowRule, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  {
    name: 'Notify Assignee on Content Generation',
    description: 'When AI generates content, notify the domain assignee to review',
    trigger: 'content_generated',
    conditions: [],
    actions: [
      {
        action: 'notify_assignee',
        params: {
          title: 'Content Ready for Review',
          priority: 'normal',
        },
      },
    ],
    enabled: true,
    priority: 10,
  },
  {
    name: 'Celebrate 50% Milestone',
    description: 'Notify team when a domain reaches 50% completion',
    trigger: 'milestone_reached',
    conditions: [
      { field: 'milestone', operator: 'equals', value: 50 },
    ],
    actions: [
      {
        action: 'notify_assignee',
        params: {
          title: 'Halfway There!',
          celebratory: true,
        },
      },
    ],
    enabled: true,
    priority: 20,
  },
  {
    name: 'Celebrate 100% Completion',
    description: 'Notify admins when a domain is fully completed',
    trigger: 'milestone_reached',
    conditions: [
      { field: 'milestone', operator: 'equals', value: 100 },
    ],
    actions: [
      {
        action: 'notify_admins',
        params: {
          title: 'Domain Complete!',
          celebratory: true,
        },
      },
      {
        action: 'notify_assignee',
        params: {
          title: 'Congratulations! Domain Complete!',
          celebratory: true,
        },
      },
    ],
    enabled: true,
    priority: 5,
  },
  {
    name: 'Deadline Warning - 3 Days',
    description: 'Warn assignee 3 days before deadline',
    trigger: 'deadline_approaching',
    conditions: [
      { field: 'daysRemaining', operator: 'less_than', value: 4 },
    ],
    actions: [
      {
        action: 'send_reminder',
        params: {
          urgency: 'warning',
        },
      },
    ],
    enabled: true,
    priority: 15,
  },
  {
    name: 'Deadline Passed - Escalate',
    description: 'Escalate to admins when deadline passes',
    trigger: 'deadline_passed',
    conditions: [],
    actions: [
      {
        action: 'escalate_to_admin',
        params: {
          urgency: 'high',
        },
      },
      {
        action: 'notify_assignee',
        params: {
          title: 'Deadline Passed',
          urgency: 'high',
        },
      },
    ],
    enabled: true,
    priority: 1,
  },
  {
    name: 'Stale Content Alert',
    description: 'Alert when content has no activity for 7 days',
    trigger: 'item_stale',
    conditions: [
      { field: 'daysSinceActivity', operator: 'greater_than', value: 7 },
    ],
    actions: [
      {
        action: 'send_reminder',
        params: {
          urgency: 'normal',
        },
      },
    ],
    enabled: true,
    priority: 25,
  },
];

// ============================================================================
// Get Workflow Rules
// ============================================================================

export async function getWorkflowRules(): Promise<{
  success: boolean;
  rules?: WorkflowRule[];
  error?: string;
}> {
  try {
    const snapshot = await adminDb
      .collection('workflow_rules')
      .orderBy('priority', 'asc')
      .get();

    if (snapshot.empty) {
      // Return default rules if none exist
      return {
        success: true,
        rules: DEFAULT_WORKFLOW_RULES.map((rule, index) => ({
          ...rule,
          id: `default-${index}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
        })),
      };
    }

    const rules: WorkflowRule[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        trigger: data.trigger,
        conditions: data.conditions || [],
        actions: data.actions || [],
        enabled: data.enabled ?? true,
        priority: data.priority ?? 100,
        createdAt: toDateFromSerialized(data.createdAt)?.toISOString() || new Date().toISOString(),
        updatedAt: toDateFromSerialized(data.updatedAt)?.toISOString() || new Date().toISOString(),
        createdBy: data.createdBy,
      };
    });

    return { success: true, rules };
  } catch (error) {
    log.error('[getWorkflowRules] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch workflow rules',
    };
  }
}

// ============================================================================
// Create/Update Workflow Rule
// ============================================================================

export async function saveWorkflowRule(
  rule: Omit<WorkflowRule, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<{
  success: boolean;
  ruleId?: string;
  error?: string;
}> {
  try {
    await requireAdmin();

    const ruleData = {
      name: rule.name,
      description: rule.description,
      trigger: rule.trigger,
      conditions: rule.conditions,
      actions: rule.actions,
      enabled: rule.enabled,
      priority: rule.priority,
      createdBy: rule.createdBy,
      updatedAt: adminTimestamp.now(),
    };

    if (rule.id && !rule.id.startsWith('default-')) {
      // Update existing
      await adminDb.collection('workflow_rules').doc(rule.id).update(ruleData);
      return { success: true, ruleId: rule.id };
    } else {
      // Create new
      const docRef = await adminDb.collection('workflow_rules').add({
        ...ruleData,
        createdAt: adminTimestamp.now(),
      });
      return { success: true, ruleId: docRef.id };
    }
  } catch (error) {
    log.error('[saveWorkflowRule] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save workflow rule',
    };
  }
}

// ============================================================================
// Toggle Workflow Rule
// ============================================================================

export async function toggleWorkflowRule(
  ruleId: string,
  enabled: boolean
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    await adminDb.collection('workflow_rules').doc(ruleId).update({
      enabled,
      updatedAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('[toggleWorkflowRule] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle workflow rule',
    };
  }
}

// ============================================================================
// Delete Workflow Rule
// ============================================================================

export async function deleteWorkflowRule(ruleId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    await adminDb.collection('workflow_rules').doc(ruleId).delete();

    return { success: true };
  } catch (error) {
    log.error('[deleteWorkflowRule] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete workflow rule',
    };
  }
}

// ============================================================================
// Execute Workflow (Trigger Handler)
// ============================================================================

export async function executeWorkflow(
  trigger: WorkflowTrigger,
  triggerData: Record<string, unknown>
): Promise<{
  success: boolean;
  executionsRun: number;
  error?: string;
}> {
  try {
    // Get all enabled rules for this trigger
    const rulesResult = await getWorkflowRules();
    if (!rulesResult.success || !rulesResult.rules) {
      return { success: false, executionsRun: 0, error: rulesResult.error };
    }

    const matchingRules = rulesResult.rules
      .filter((rule) => rule.enabled && rule.trigger === trigger)
      .sort((a, b) => a.priority - b.priority);

    let executionsRun = 0;

    for (const rule of matchingRules) {
      // Check conditions
      const conditionsMet = rule.conditions.every((condition) => {
        const value = triggerData[condition.field];
        switch (condition.operator) {
          case 'equals':
            return value === condition.value;
          case 'not_equals':
            return value !== condition.value;
          case 'greater_than':
            return typeof value === 'number' && value > (condition.value as number);
          case 'less_than':
            return typeof value === 'number' && value < (condition.value as number);
          case 'contains':
            return typeof value === 'string' && value.includes(condition.value as string);
          default:
            return false;
        }
      });

      if (!conditionsMet) continue;

      // Execute actions
      const actionsExecuted: string[] = [];
      for (const actionConfig of rule.actions) {
        try {
          await executeAction(actionConfig, triggerData);
          actionsExecuted.push(actionConfig.action);
        } catch (actionError) {
          log.error(`[executeWorkflow] Action ${actionConfig.action} failed:`, actionError);
        }
      }

      // Log execution
      await adminDb.collection('workflow_executions').add({
        ruleId: rule.id,
        ruleName: rule.name,
        trigger,
        triggerData,
        actionsExecuted,
        status: actionsExecuted.length === rule.actions.length ? 'success' : 'partial',
        executedAt: adminTimestamp.now(),
      });

      executionsRun++;
    }

    return { success: true, executionsRun };
  } catch (error) {
    log.error('[executeWorkflow] Error:', error);
    return {
      success: false,
      executionsRun: 0,
      error: error instanceof Error ? error.message : 'Failed to execute workflow',
    };
  }
}

// ============================================================================
// Execute Individual Action
// ============================================================================

async function executeAction(
  actionConfig: WorkflowActionConfig,
  triggerData: Record<string, unknown>
): Promise<void> {
  const { action, params } = actionConfig;

  switch (action) {
    case 'notify_assignee': {
      const domainId = triggerData.domainId as string;
      if (!domainId) return;

      const assignmentResult = await getDomainAssignment(domainId);
      if (!assignmentResult.success || !assignmentResult.assignment) return;

      await createOperationalNotification({
        type: 'review_needed',
        userId: assignmentResult.assignment.assigneeId,
        title: (params.title as string) || 'Action Required',
        message: triggerData.message as string || 'You have a new item requiring attention.',
        metadata: {
          domainId,
          domainName: triggerData.domainName as string,
          ksbId: triggerData.ksbId as string,
          ksbName: triggerData.ksbName as string,
          actionUrl: `/nucleus/admin/academy/my-work`,
        },
      });
      break;
    }

    case 'notify_admins': {
      // Get all admin users
      const adminsSnapshot = await adminDb
        .collection('users')
        .where('role', '==', 'admin')
        .get();

      // Parallelize admin notifications for better performance
      await Promise.all(
        adminsSnapshot.docs.map((adminDoc) =>
          createOperationalNotification({
            type: params.celebratory ? 'milestone_reached' : 'review_needed',
            userId: adminDoc.id,
            title: (params.title as string) || 'Admin Notification',
            message: triggerData.message as string || 'An item requires admin attention.',
            metadata: {
              domainId: triggerData.domainId as string,
              domainName: triggerData.domainName as string,
              actionUrl: `/nucleus/admin/academy/operations`,
            },
          })
        )
      );
      break;
    }

    case 'notify_specific_user': {
      const userId = params.userId as string;
      if (!userId) return;

      await createOperationalNotification({
        type: 'review_needed',
        userId,
        title: (params.title as string) || 'Notification',
        message: triggerData.message as string || 'You have a notification.',
        metadata: {
          domainId: triggerData.domainId as string,
          domainName: triggerData.domainName as string,
        },
      });
      break;
    }

    case 'send_reminder': {
      const domainId = triggerData.domainId as string;
      if (!domainId) return;

      const assignmentResult = await getDomainAssignment(domainId);
      if (!assignmentResult.success || !assignmentResult.assignment) return;

      const urgency = params.urgency as string || 'normal';
      const type = urgency === 'high' ? 'deadline_approaching' : 'review_needed';

      await createOperationalNotification({
        type,
        userId: assignmentResult.assignment.assigneeId,
        title: urgency === 'high' ? 'Urgent Reminder' : 'Reminder',
        message: triggerData.message as string || `Reminder: ${triggerData.domainName} needs attention.`,
        metadata: {
          domainId,
          domainName: triggerData.domainName as string,
          actionUrl: `/nucleus/admin/academy/my-work`,
        },
      });
      break;
    }

    case 'escalate_to_admin': {
      const adminsSnapshot = await adminDb
        .collection('users')
        .where('role', '==', 'admin')
        .get();

      // Parallelize escalation notifications for better performance
      await Promise.all(
        adminsSnapshot.docs.map((adminDoc) =>
          createOperationalNotification({
            type: 'deadline_approaching',
            userId: adminDoc.id,
            title: 'Escalation: Deadline Passed',
            message: `${triggerData.domainName || 'An item'} has passed its deadline and requires attention.`,
            metadata: {
              domainId: triggerData.domainId as string,
              domainName: triggerData.domainName as string,
              actionUrl: `/nucleus/admin/academy/operations`,
            },
          })
        )
      );
      break;
    }

    case 'auto_assign_reviewer':
    case 'update_status':
    case 'create_task':
      // These actions can be implemented as needed
      log.debug(`[executeAction] Action ${action} not yet implemented`);
      break;
  }
}

// ============================================================================
// Get Workflow Execution History
// ============================================================================

export async function getWorkflowExecutionHistory(
  limit: number = 50
): Promise<{
  success: boolean;
  executions?: WorkflowExecution[];
  error?: string;
}> {
  try {
    const snapshot = await adminDb
      .collection('workflow_executions')
      .orderBy('executedAt', 'desc')
      .limit(limit)
      .get();

    const executions: WorkflowExecution[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ruleId: data.ruleId,
        ruleName: data.ruleName,
        trigger: data.trigger,
        triggerData: data.triggerData || {},
        actionsExecuted: data.actionsExecuted || [],
        status: data.status,
        error: data.error,
        executedAt: toDateFromSerialized(data.executedAt)?.toISOString() || new Date().toISOString(),
      };
    });

    return { success: true, executions };
  } catch (error) {
    log.error('[getWorkflowExecutionHistory] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch execution history',
    };
  }
}

// ============================================================================
// Trigger Helpers (Called from other actions)
// ============================================================================

/**
 * Trigger workflow when content is generated
 */
export async function triggerContentGenerated(params: {
  domainId: string;
  domainName: string;
  ksbId: string;
  ksbName: string;
}): Promise<void> {
  await executeWorkflow('content_generated', {
    ...params,
    message: `AI-generated content for "${params.ksbName}" is ready for review.`,
  });
}

/**
 * Trigger workflow when milestone is reached
 */
export async function triggerMilestoneReached(params: {
  domainId: string;
  domainName: string;
  milestone: number;
  assigneeId?: string;
}): Promise<void> {
  await executeWorkflow('milestone_reached', {
    ...params,
    message: params.milestone === 100
      ? `${params.domainName} is now 100% complete!`
      : `${params.domainName} has reached ${params.milestone}% completion.`,
  });

  // Also send direct notification if assignee known
  if (params.assigneeId) {
    await notifyMilestoneReached({
      userId: params.assigneeId,
      domainId: params.domainId,
      domainName: params.domainName,
      milestone: params.milestone,
    });
  }
}

/**
 * Trigger workflow when content is published
 */
export async function triggerContentPublished(params: {
  domainId: string;
  domainName: string;
  ksbId: string;
  ksbName: string;
  publishedBy: string;
}): Promise<void> {
  await executeWorkflow('content_published', {
    ...params,
    message: `"${params.ksbName}" has been published.`,
  });
}
