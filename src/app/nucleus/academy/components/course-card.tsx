'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, BookOpen, Award, PlayCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Course } from '@/types/academy';

interface CourseCardProps {
  course: Course;
  isEnrolled?: boolean;
  enrollmentProgress?: number;
}

export function CourseCard({ course, isEnrolled = false, enrollmentProgress }: CourseCardProps) {
  const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  const durationHours = Math.floor(course.metadata.estimatedDuration / 60);
  const durationMinutes = course.metadata.estimatedDuration % 60;

  // Generate a deterministic color based on course topic
  const topicColors: Record<string, string> = {
    'Drug Safety': 'from-blue-500 to-cyan-500',
    'Clinical Trials': 'from-purple-500 to-pink-500',
    'Regulatory': 'from-green-500 to-teal-500',
    'Data Management': 'from-orange-500 to-yellow-500',
    'Medical Writing': 'from-red-500 to-rose-500',
    'GCP': 'from-indigo-500 to-purple-500',
    'default': 'from-gray-500 to-gray-600'
  };
  const gradientClass = topicColors[course.topic] || topicColors.default;

  return (
    <Card className="flex flex-col h-full group hover:shadow-xl hover:scale-[1.02] hover:border-cyan/50 transition-all duration-300 overflow-hidden">
      {/* Image/Thumbnail Section */}
      <div className="relative h-48 bg-gradient-to-br overflow-hidden">
        {course.metadata?.thumbnailUrl ? (
          <Image
            src={course.metadata.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradientClass} opacity-80`}>
            <div className="flex items-center justify-center h-full">
              <BookOpen className="h-16 w-16 text-white/50" />
            </div>
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="secondary" className="text-xs bg-white/90 backdrop-blur-sm">
            {course.topic}
          </Badge>
          {course.qualityScore >= 80 && (
            <Badge className="bg-nex-gold-500/90 text-nex-dark hover:bg-nex-gold-600 text-xs backdrop-blur-sm">
              <Award className="h-3 w-3 mr-1" />
              Top Rated
            </Badge>
          )}
        </div>

        {/* Enrolled indicator */}
        {isEnrolled && (
          <div className="absolute top-3 right-3">
            <div className="bg-cyan/90 backdrop-blur-sm rounded-full p-2">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-2 leading-snug group-hover:text-cyan transition-colors">
          {course.title}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm mt-2">{course.description}</CardDescription>

        {/* Instructor Info (F011) */}
        {course.instructor?.name && (
          <div className="mt-3 flex items-center gap-2">
            {course.instructor.avatar && (
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="h-6 w-6 rounded-full object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                Taught by <span className="font-medium text-foreground">{course.instructor.name}</span>
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              {durationHours > 0 && `${durationHours}h `}
              {durationMinutes}m
            </span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{totalLessons} activities</span>
          </div>
        </div>

        {isEnrolled && enrollmentProgress !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(enrollmentProgress)}%</span>
            </div>
            <Progress value={enrollmentProgress} className="h-2" />
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3">
        {isEnrolled ? (
          <Button asChild className="w-full bg-cyan hover:bg-cyan-dark/80 group/btn" variant="default">
            <Link href={`/nucleus/academy/build/${course.id}`}>
              <PlayCircle className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
              Continue Building
            </Link>
          </Button>
        ) : (
          <Button asChild className="w-full group/btn hover:bg-cyan-dark hover:text-white hover:border-cyan transition-all" variant="outline">
            <Link href={`/nucleus/academy/courses/${course.id}`}>
              View Pathway Details
              <BookOpen className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
