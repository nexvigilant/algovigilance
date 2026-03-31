'use client';

import { Settings2, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { Course } from '@/types/academy';

interface CourseInfoPanelProps {
  course: Course;
  courseInfoExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onCourseChange: (updates: Partial<Course>) => void;
}

export function CourseInfoPanel({
  course,
  courseInfoExpanded,
  onExpandedChange,
  onCourseChange,
}: CourseInfoPanelProps) {
  return (
    <Collapsible open={courseInfoExpanded} onOpenChange={onExpandedChange} className="mb-6">
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings2 className="h-5 w-5 text-slate-dim" />
                <div>
                  <CardTitle className="text-slate-light">Course Information</CardTitle>
                  <CardDescription className="text-slate-dim">
                    {course.modules.length} modules • {course.modules.reduce((total, m) => total + m.lessons.length, 0)} lessons • Click to {courseInfoExpanded ? 'collapse' : 'edit'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                    {course.status}
                  </Badge>
                  <span className="text-slate-dim">
                    {Math.floor((course.metadata.estimatedDuration || 0) / 60)}h {Math.round((course.metadata.estimatedDuration || 0) % 60)}m
                  </span>
                </div>
                {courseInfoExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="border-t pt-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-light">Basic Information</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course-title">Course Title</Label>
                  <Input
                    id="course-title"
                    value={course.title}
                    onChange={(e) => onCourseChange({ title: e.target.value })}
                    placeholder="e.g., Signal Detection in Pharmacovigilance"
                    maxLength={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-description">Description</Label>
                  <Textarea
                    id="course-description"
                    value={course.description}
                    onChange={(e) => onCourseChange({ description: e.target.value })}
                    placeholder="Brief description of what practitioners will learn..."
                    rows={3}
                    maxLength={1000}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-topic">Topic</Label>
                    <Input
                      id="course-topic"
                      value={course.topic}
                      onChange={(e) => onCourseChange({ topic: e.target.value })}
                      placeholder="e.g., Pharmacovigilance"
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-difficulty">Difficulty Level</Label>
                    <Select
                      value={course.difficulty || 'intermediate'}
                      onValueChange={(value) => onCourseChange({ difficulty: value as 'beginner' | 'intermediate' | 'advanced' })}
                    >
                      <SelectTrigger id="course-difficulty">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Categorization */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-light">Categorization</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course-domain">Domain</Label>
                  <Select
                    value={course.domain || 'Healthcare'}
                    onValueChange={(value) => onCourseChange({ domain: value })}
                  >
                    <SelectTrigger id="course-domain">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Life Sciences">Life Sciences</SelectItem>
                      <SelectItem value="Regulatory Affairs">Regulatory Affairs</SelectItem>
                      <SelectItem value="Clinical Research">Clinical Research</SelectItem>
                      <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                      <SelectItem value="Medical Writing">Medical Writing</SelectItem>
                      <SelectItem value="Drug Safety">Drug Safety</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-audience">Target Audience</Label>
                  <Select
                    value={course.targetAudience || 'Healthcare Professionals'}
                    onValueChange={(value) => onCourseChange({ targetAudience: value })}
                  >
                    <SelectTrigger id="course-audience">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PharmD">PharmD</SelectItem>
                      <SelectItem value="MD">MD</SelectItem>
                      <SelectItem value="Nurses">Nurses</SelectItem>
                      <SelectItem value="Allied Health">Allied Health</SelectItem>
                      <SelectItem value="Healthcare Professionals">Healthcare Professionals</SelectItem>
                      <SelectItem value="Industry Professionals">Industry Professionals</SelectItem>
                      <SelectItem value="Students">Students</SelectItem>
                      <SelectItem value="All">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Visibility */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-light">Visibility</h4>
              <div className="space-y-2">
                <Label htmlFor="course-visibility">Access Level</Label>
                <Select
                  value={course.visibility}
                  onValueChange={(value) => onCourseChange({ visibility: value as 'internal' | 'public' })}
                >
                  <SelectTrigger id="course-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal (Members Only)</SelectItem>
                    <SelectItem value="public">Public (Anyone Can Enroll)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-dim">
                  Internal courses are only visible to logged-in members. Publishing status is managed separately.
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
