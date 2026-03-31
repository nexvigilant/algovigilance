'use client';

import { useState, useEffect } from 'react';
import {
  Workflow,
  Play,
  ChevronDown,
  ChevronUp,
  Check,
  Zap,
  Bell,
  Users,
  Clock,
  AlertTriangle,
  Loader2,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  getWorkflowRules,
  toggleWorkflowRule,
  getWorkflowExecutionHistory,
  type WorkflowRule,
  type WorkflowExecution,
  type WorkflowTrigger,
} from '@/lib/actions/workflow-automation';

import { logger } from '@/lib/logger';
const log = logger.scope('operations/workflow-panel');

function getTriggerIcon(trigger: WorkflowTrigger) {
  switch (trigger) {
    case 'content_generated':
      return <Zap className="h-4 w-4 text-violet-400" />;
    case 'content_reviewed':
    case 'content_published':
      return <Check className="h-4 w-4 text-emerald-400" />;
    case 'milestone_reached':
      return <Zap className="h-4 w-4 text-gold" />;
    case 'deadline_approaching':
    case 'deadline_passed':
      return <Clock className="h-4 w-4 text-amber-400" />;
    case 'assignment_created':
      return <Users className="h-4 w-4 text-cyan" />;
    case 'item_stale':
      return <AlertTriangle className="h-4 w-4 text-slate-dim" />;
    default:
      return <Bell className="h-4 w-4 text-slate-dim" />;
  }
}

function getTriggerLabel(trigger: WorkflowTrigger): string {
  switch (trigger) {
    case 'content_generated':
      return 'Content Generated';
    case 'content_reviewed':
      return 'Content Reviewed';
    case 'content_published':
      return 'Content Published';
    case 'milestone_reached':
      return 'Milestone Reached';
    case 'deadline_approaching':
      return 'Deadline Approaching';
    case 'deadline_passed':
      return 'Deadline Passed';
    case 'assignment_created':
      return 'New Assignment';
    case 'item_stale':
      return 'Stale Item';
    default:
      return trigger;
  }
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return then.toLocaleDateString();
}

export function WorkflowPanel() {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [togglingRule, setTogglingRule] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [rulesRes, executionsRes] = await Promise.all([
        getWorkflowRules(),
        getWorkflowExecutionHistory(20),
      ]);

      if (rulesRes.success) {
        setRules(rulesRes.rules || []);
      }
      if (executionsRes.success) {
        setExecutions(executionsRes.executions || []);
      }
    } catch (error) {
      log.error('Failed to load workflow data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleToggleRule(ruleId: string, enabled: boolean) {
    setTogglingRule(ruleId);
    try {
      // Skip toggle for default rules (they're in-memory only)
      if (ruleId.startsWith('default-')) {
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, enabled } : r))
        );
      } else {
        const result = await toggleWorkflowRule(ruleId, enabled);
        if (result.success) {
          setRules((prev) =>
            prev.map((r) => (r.id === ruleId ? { ...r, enabled } : r))
          );
        }
      }
    } catch (error) {
      log.error('Failed to toggle rule:', error);
    } finally {
      setTogglingRule(null);
    }
  }

  const enabledRules = rules.filter((r) => r.enabled);
  const recentExecutions = executions.slice(0, 5);

  return (
    <Card className="bg-nex-surface border-nex-light">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-violet-400" />
            <CardTitle className="text-slate-light">Workflow Automation</CardTitle>
            <Badge variant="secondary" className="bg-violet-500/20 text-violet-400">
              {enabledRules.length} Active
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className={`text-slate-dim hover:text-cyan ${showHistory ? 'text-cyan' : ''}`}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Execution History</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-slate-dim hover:text-cyan"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-cyan" />
          </div>
        ) : showHistory ? (
          // Execution History View
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-light">Recent Executions</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(false)}
                className="text-xs text-slate-dim hover:text-cyan"
              >
                Back to Rules
              </Button>
            </div>
            {recentExecutions.length === 0 ? (
              <p className="text-sm text-slate-dim text-center py-4">
                No workflow executions yet
              </p>
            ) : (
              <div className="space-y-2">
                {recentExecutions.map((execution) => (
                  <div
                    key={execution.id}
                    className="p-3 rounded-lg bg-nex-dark border border-nex-light"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-light truncate">
                          {execution.ruleName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              execution.status === 'success'
                                ? 'border-emerald-500/50 text-emerald-400'
                                : execution.status === 'partial'
                                ? 'border-amber-500/50 text-amber-400'
                                : 'border-red-500/50 text-red-400'
                            }`}
                          >
                            {execution.status}
                          </Badge>
                          <span className="text-xs text-slate-dim">
                            {formatTimeAgo(execution.executedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-dim">
                        {execution.actionsExecuted.length} action
                        {execution.actionsExecuted.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : expanded ? (
          // Full Rules List
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-3 rounded-lg border transition-colors ${
                  rule.enabled
                    ? 'bg-nex-dark border-violet-500/30'
                    : 'bg-nex-dark/50 border-nex-light opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getTriggerIcon(rule.trigger)}</div>
                    <div>
                      <p className="text-sm font-medium text-slate-light">{rule.name}</p>
                      <p className="text-xs text-slate-dim mt-0.5">{rule.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className="text-xs border-nex-light text-slate-dim"
                        >
                          {getTriggerLabel(rule.trigger)}
                        </Badge>
                        {rule.conditions.length > 0 && (
                          <span className="text-xs text-slate-dim">
                            {rule.conditions.length} condition
                            {rule.conditions.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="text-xs text-slate-dim">
                          {rule.actions.length} action
                          {rule.actions.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                    disabled={togglingRule === rule.id}
                    className="data-[state=checked]:bg-violet-500"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Collapsed Summary View
          <div className="space-y-3">
            {/* Quick Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-violet-400" />
                  <span className="text-xs text-slate-dim">Active Rules</span>
                </div>
                <p className="text-xl font-bold text-violet-400 mt-1">
                  {enabledRules.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-slate-dim">Executions (24h)</span>
                </div>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  {executions.filter((e) => {
                    const date = new Date(e.executedAt);
                    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return date > dayAgo;
                  }).length}
                </p>
              </div>
            </div>

            {/* Active Rules Preview */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-dim uppercase tracking-wider">
                Active Automations
              </h4>
              {enabledRules.slice(0, 3).map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center gap-2 p-2 rounded bg-nex-dark/50"
                >
                  {getTriggerIcon(rule.trigger)}
                  <span className="text-sm text-slate-light truncate">{rule.name}</span>
                </div>
              ))}
              {enabledRules.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(true)}
                  className="w-full text-xs text-slate-dim hover:text-cyan"
                >
                  +{enabledRules.length - 3} more rules
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
