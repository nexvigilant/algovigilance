'use client';

import { Plus, GripVertical, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { VoiceEmptyState } from '@/components/voice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Course } from '@/types/academy';

interface ModulesPanelProps {
  course: Course;
  onAddModule: () => void;
  onEditModule: (index: number) => void;
  onDeleteModule: (index: number) => void;
  onMoveModule: (index: number, direction: 'up' | 'down') => void;
  onAddLesson: (moduleIndex: number) => void;
  onEditLesson: (moduleIndex: number, lessonIndex: number) => void;
  onDeleteLesson: (moduleIndex: number, lessonIndex: number) => void;
}

export function ModulesPanel({
  course,
  onAddModule,
  onEditModule,
  onDeleteModule,
  onMoveModule,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}: ModulesPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-slate-light">Course Content</CardTitle>
            <CardDescription className="text-slate-dim">Organize your course into modules and lessons</CardDescription>
          </div>
          <Button onClick={onAddModule}>
            <Plus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {course.modules.length === 0 ? (
          <VoiceEmptyState
            context="courses"
            title="No modules yet"
            description="Add modules to organize your course content"
            variant="inline"
            size="md"
            action={{
              label: 'Create Your First Module',
              onClick: onAddModule,
            }}
          />
        ) : (
          <div className="space-y-4">
            {course.modules.map((module, moduleIndex) => (
              <Card key={module.id || `module-${moduleIndex}`} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onMoveModule(moduleIndex, 'up')}
                        disabled={moduleIndex === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <GripVertical className="h-4 w-4 text-slate-dim" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onMoveModule(moduleIndex, 'down')}
                        disabled={moduleIndex === course.modules.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">Module {moduleIndex + 1}: {module.title}</div>
                          <div className="text-sm text-slate-dim">{module.description}</div>
                          <div className="text-xs text-slate-dim mt-1">
                            {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditModule(moduleIndex)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteModule(moduleIndex)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="ml-8 space-y-2">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lesson.id || `lesson-${moduleIndex}-${lessonIndex}`}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{lesson.title}</div>
                          <div className="text-xs text-slate-dim">
                            {lesson.estimatedDuration || 0} min
                            {lesson.videoUrl && ' • Video'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditLesson(moduleIndex, lessonIndex)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteLesson(moduleIndex, lessonIndex)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddLesson(moduleIndex)}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Add Lesson
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
