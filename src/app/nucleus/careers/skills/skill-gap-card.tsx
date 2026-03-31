'use client';

import Link from 'next/link';
import { BookOpen, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Course } from '@/types/academy';

interface SkillGapCardProps {
  skillName: string;
  category: string;
  requiredLevel: string;
  currentLevel?: string;
  gap: number;
  recommendedCourses: string[] | Course[]; // Support both string titles and Course objects
}

export function SkillGapCard({
  skillName,
  category,
  requiredLevel,
  currentLevel,
  gap,
  recommendedCourses,
}: SkillGapCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold">{skillName}</h4>
          <p className="text-sm text-muted-foreground">
            {currentLevel
              ? `Current: ${currentLevel} → Target: ${requiredLevel}`
              : `Target: ${requiredLevel}`}
          </p>
        </div>
        <Badge variant="outline">{category}</Badge>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span>Skill Gap</span>
          <span className="font-medium">{gap}%</span>
        </div>
        <Progress value={100 - gap} className="h-2" />
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Recommended Courses:</p>
        <div className="space-y-2">
          {recommendedCourses.map((course, i) => {
            const isCourseObject = typeof course === 'object';
            const courseId = isCourseObject ? course.id : undefined;
            const title = isCourseObject ? course.title : course;
            const description = isCourseObject ? course.description : undefined;
            const duration = isCourseObject ? course.metadata?.estimatedDuration : undefined;
            const difficulty = isCourseObject ? course.difficulty : undefined;

            return (
              <div
                key={isCourseObject ? course.id : i}
                className="p-3 border border-muted rounded-lg hover:border-cyan/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-semibold truncate">{title}</h5>
                    {description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{description}</p>
                    )}
                  </div>
                  {difficulty && (
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {difficulty}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{Math.ceil(duration / 60)} min</span>
                    </div>
                  )}
                  <Button asChild size="sm" variant="default" className="text-xs">
                    <Link href={courseId ? `/nucleus/academy/courses/${courseId}` : '/nucleus/academy'}>
                      <BookOpen className="h-3 w-3 mr-1" />
                      Explore
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
