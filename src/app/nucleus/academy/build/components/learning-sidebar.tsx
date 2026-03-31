'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Course, Enrollment } from '@/types/academy';

interface LearningSidebarProps {
  course: Course;
  enrollment: Enrollment;
  currentModuleIndex: number;
  currentLessonIndex: number;
  onNavigate: (moduleIndex: number, lessonIndex: number) => void;
  isOpen: boolean;
}

export function LearningSidebar({
  course,
  enrollment,
  currentModuleIndex,
  currentLessonIndex,
  onNavigate,
  isOpen,
}: LearningSidebarProps) {
  const router = useRouter();

  return (
    <aside
      className={`border-r bg-card transition-all duration-300 ${
        isOpen ? 'w-80' : 'w-0'
      } overflow-hidden`}
    >
      <div className="p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/nucleus/academy/courses/${course.id}`)}
          className="w-full justify-start mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Course Details
        </Button>
        <h2 className="font-bold text-lg line-clamp-2 mb-2">{course.title}</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(enrollment.progress)}%</span>
          </div>
          <Progress value={enrollment.progress} className="h-2" />
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4 space-y-4">
          {course.modules.map((module, moduleIndex) => (
            <div key={module.id}>
              <h3 className="font-semibold text-sm mb-2">
                Module {moduleIndex + 1}: {module.title}
              </h3>
              <ul className="space-y-1">
                {module.lessons.map((lesson, lessonIndex) => {
                  const isCompleted = enrollment.completedLessons.includes(lesson.id);
                  const isCurrent =
                    moduleIndex === currentModuleIndex && lessonIndex === currentLessonIndex;

                  return (
                    <li key={lesson.id}>
                      <button
                        onClick={() => onNavigate(moduleIndex, lessonIndex)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {isCompleted ? (
                          <div className="h-4 w-4 flex-shrink-0 rounded-full bg-cyan flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-muted-foreground/40" />
                        )}
                        <span className="flex-1 line-clamp-2">{lesson.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
