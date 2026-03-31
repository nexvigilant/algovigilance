'use client';

import { useState } from 'react';
import { Target, Calendar, TrendingUp, ChevronRight, Trash2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { SkillGoal } from './goal-setting-dialog';

interface ActiveGoalsProps {
  goals: (SkillGoal & { id: string; progress: number })[];
  onRemoveGoal: (goalId: string) => void;
  onUpdateProgress: (goalId: string, milestoneIndex: number) => void;
  onViewCourses: (skillId: string) => void;
}

export function ActiveGoals({ goals, onRemoveGoal, onUpdateProgress, onViewCourses }: ActiveGoalsProps) {
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  const getPriorityColor = (priority: SkillGoal['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-100 dark:bg-red-900/20';
      case 'medium':
        return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low':
        return 'text-green-500 bg-green-100 dark:bg-green-900/20';
    }
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = Math.abs(deadlineDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusIcon = (progress: number, deadline: string) => {
    const daysLeft = getDaysRemaining(deadline);
    const isOverdue = new Date(deadline) < new Date();

    if (progress === 100) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (isOverdue) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    } else if (daysLeft < 30) {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    }
    return <Target className="h-5 w-5 text-cyan" />;
  };

  if (goals.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No Active Goals</p>
          <p className="text-sm text-muted-foreground mb-4">
            Set skill development goals to track your learning journey
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {goals.map((goal) => {
          const isExpanded = expandedGoal === goal.id;
          const daysLeft = getDaysRemaining(goal.deadline);
          const isOverdue = new Date(goal.deadline) < new Date();
          const completedMilestones = goal.milestones.filter((_, idx) => idx < Math.floor(goal.progress / 25)).length;

          return (
            <Card key={goal.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(goal.progress, goal.deadline)}
                    <div>
                      <CardTitle className="text-lg">{goal.skillName}</CardTitle>
                      <CardDescription className="mt-1">
                        Target: {goal.targetLevel} level
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(goal.priority)} variant="outline">
                      {goal.priority} priority
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setGoalToDelete(goal.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Progress Bar */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(goal.progress)}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-4 text-sm mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className={isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                      {isOverdue ? `Overdue by ${daysLeft} days` : `${daysLeft} days remaining`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {completedMilestones}/{goal.milestones.length} milestones
                    </span>
                  </div>
                </div>

                {/* Motivation (if provided) */}
                {goal.reason && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm mb-4">
                    <p className="font-medium mb-1">Motivation:</p>
                    <p className="text-muted-foreground">{goal.reason}</p>
                  </div>
                )}

                {/* Expand/Collapse Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                  className="w-full justify-between"
                >
                  <span>{isExpanded ? 'Hide' : 'Show'} Milestones</span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </Button>

                {/* Expanded Milestones */}
                {isExpanded && (
                  <div className="mt-4 space-y-2 pt-4 border-t">
                    <h4 className="font-medium text-sm mb-3">Milestones</h4>
                    {goal.milestones.map((milestone, idx) => {
                      const isCompleted = idx < Math.floor(goal.progress / 25);
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() => onUpdateProgress(goal.id, idx)}
                            className="data-[state=checked]:bg-cyan data-[state=checked]:border-cyan"
                          />
                          <span className={`text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {milestone}
                          </span>
                        </div>
                      );
                    })}

                    {/* Action Button */}
                    <div className="pt-4">
                      <Button
                        onClick={() => onViewCourses(goal.skillId)}
                        className="w-full bg-cyan hover:bg-cyan-dark/80"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Find Courses for This Skill
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!goalToDelete} onOpenChange={() => setGoalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the skill goal from your tracker. You can always set a new goal later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (goalToDelete) {
                  onRemoveGoal(goalToDelete);
                  setGoalToDelete(null);
                }
              }}
            >
              Remove Goal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}