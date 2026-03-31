'use client';

import { useState } from 'react';
import { Calendar, Target, TrendingUp, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GoalSettingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availableSkills: Array<{ id: string; name: string; category: string }>;
  currentSkills: string[];
  onSaveGoal: (goal: SkillGoal) => void;
}

export interface SkillGoal {
  skillId: string;
  skillName: string;
  targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  deadline: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  milestones: string[];
}

export function GoalSettingDialog({
  isOpen,
  onClose,
  availableSkills,
  currentSkills,
  onSaveGoal,
}: GoalSettingDialogProps) {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [targetLevel, setTargetLevel] = useState<SkillGoal['targetLevel']>('intermediate');
  const [deadline, setDeadline] = useState('3-months');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<SkillGoal['priority']>('medium');

  const newSkills = availableSkills.filter((skill) => !currentSkills.includes(skill.id));

  const handleSave = () => {
    if (!selectedSkill) return;

    const skill = availableSkills.find((s) => s.id === selectedSkill);
    if (!skill) return;

    // Calculate deadline date
    const deadlineDate = new Date();
    if (deadline === '1-month') {
      deadlineDate.setMonth(deadlineDate.getMonth() + 1);
    } else if (deadline === '3-months') {
      deadlineDate.setMonth(deadlineDate.getMonth() + 3);
    } else if (deadline === '6-months') {
      deadlineDate.setMonth(deadlineDate.getMonth() + 6);
    } else {
      deadlineDate.setFullYear(deadlineDate.getFullYear() + 1);
    }

    // Generate milestones based on target level
    const milestones = [];
    if (targetLevel === 'beginner') {
      milestones.push('Complete introductory course', 'Practice basic concepts');
    } else if (targetLevel === 'intermediate') {
      milestones.push('Complete foundational course', 'Apply skills in project', 'Pass assessment');
    } else if (targetLevel === 'advanced') {
      milestones.push('Complete advanced course', 'Lead a project', 'Mentor others', 'Earn certification');
    } else {
      milestones.push('Master advanced techniques', 'Publish research/articles', 'Speak at conference', 'Industry recognition');
    }

    const goal: SkillGoal = {
      skillId: skill.id,
      skillName: skill.name,
      targetLevel,
      deadline: deadlineDate.toISOString(),
      reason,
      priority,
      milestones,
    };

    onSaveGoal(goal);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedSkill('');
    setTargetLevel('intermediate');
    setDeadline('3-months');
    setReason('');
    setPriority('medium');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-cyan" />
            Set a New Skill Goal
          </DialogTitle>
          <DialogDescription>
            Define your learning objectives and track your progress towards mastery
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Skill Selection */}
          <div className="space-y-2">
            <Label htmlFor="skill">Select Skill to Develop</Label>
            <Select value={selectedSkill} onValueChange={setSelectedSkill}>
              <SelectTrigger id="skill">
                <SelectValue placeholder="Choose a skill..." />
              </SelectTrigger>
              <SelectContent>
                {newSkills.map((skill) => (
                  <SelectItem key={skill.id} value={skill.id}>
                    <div className="flex items-center gap-2">
                      <span>{skill.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {skill.category}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Level */}
          <div className="space-y-2">
            <Label>Target Proficiency Level</Label>
            <RadioGroup value={targetLevel} onValueChange={(value) => setTargetLevel(value as SkillGoal['targetLevel'])}>
              <div className="grid grid-cols-2 gap-3">
                <Card className="cursor-pointer hover:border-cyan transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="beginner" id="beginner" />
                      <Label htmlFor="beginner" className="cursor-pointer flex-1">
                        <div>
                          <div className="font-medium">Beginner</div>
                          <div className="text-xs text-muted-foreground">Basic understanding</div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-cyan transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="intermediate" id="intermediate" />
                      <Label htmlFor="intermediate" className="cursor-pointer flex-1">
                        <div>
                          <div className="font-medium">Intermediate</div>
                          <div className="text-xs text-muted-foreground">Working knowledge</div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-cyan transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="advanced" id="advanced" />
                      <Label htmlFor="advanced" className="cursor-pointer flex-1">
                        <div>
                          <div className="font-medium">Advanced</div>
                          <div className="text-xs text-muted-foreground">Deep expertise</div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-cyan transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="expert" id="expert" />
                      <Label htmlFor="expert" className="cursor-pointer flex-1">
                        <div>
                          <div className="font-medium">Expert</div>
                          <div className="text-xs text-muted-foreground">Industry leader</div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </RadioGroup>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Target Timeline</Label>
            <Select value={deadline} onValueChange={setDeadline}>
              <SelectTrigger id="deadline">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-month">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>1 Month (Sprint)</span>
                  </div>
                </SelectItem>
                <SelectItem value="3-months">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>3 Months (Quarter)</span>
                  </div>
                </SelectItem>
                <SelectItem value="6-months">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>6 Months (Half-year)</span>
                  </div>
                </SelectItem>
                <SelectItem value="1-year">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>1 Year (Annual)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority Level</Label>
            <RadioGroup value={priority} onValueChange={(value) => setPriority(value as SkillGoal['priority'])}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low-priority" />
                  <Label htmlFor="low-priority">Low</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium-priority" />
                  <Label htmlFor="medium-priority">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high-priority" />
                  <Label htmlFor="high-priority">High</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Motivation */}
          <div className="space-y-2">
            <Label htmlFor="reason">Why is this goal important to you?</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Career advancement, new project requirements, personal interest..."
              className="min-h-[80px]"
            />
          </div>

          {/* Preview */}
          {selectedSkill && (
            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                <strong>Goal Preview:</strong> Achieve {targetLevel} level in{' '}
                {availableSkills.find((s) => s.id === selectedSkill)?.name} within{' '}
                {deadline.replace('-', ' ')} with {priority} priority.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedSkill}
            className="bg-cyan hover:bg-cyan-dark/80"
          >
            Set Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}