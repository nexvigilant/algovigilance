'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, BookOpen, Award, CheckCircle, PlayCircle, Video, Target, GraduationCap, TrendingUp, Users, User, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getCourseById, getUserInfo } from '@/app/nucleus/academy/actions';
import type { Course } from '@/types/academy';

import { logger } from '@/lib/logger';
const log = logger.scope('preview/page');

export default function AdminCoursePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [instructorInfo, setInstructorInfo] = useState<{
    name?: string;
    avatar?: string;
    email?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true);
        setError(null);

        const courseData = await getCourseById(courseId);

        if (!courseData) {
          setError('Course not found');
          return;
        }

        setCourse(courseData);

        // Fetch instructor info if course has userId
        if (courseData.userId) {
          const instructorData = await getUserInfo(courseData.userId);
          setInstructorInfo(instructorData);
        }
      } catch (err) {
        log.error('Error loading course:', err);
        setError('Failed to load course. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [courseId]);

  if (loading) {
    return <CoursePreviewSkeleton />;
  }

  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-12 md:px-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertDescription>{error || 'Course not found'}</AlertDescription>
        </Alert>
        <div className="text-center mt-6">
          <Button onClick={() => router.push('/nucleus/admin/academy/courses')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course Management
          </Button>
        </div>
      </div>
    );
  }

  // Calculate course metrics
  const totalLessons = course.modules?.reduce((acc, module) => acc + (module.lessons?.length ?? 0), 0) ?? 0;
  const estimatedDuration = course.metadata?.estimatedDuration ?? 0;
  const durationHours = Math.floor(estimatedDuration / 60);
  const durationMinutes = estimatedDuration % 60;

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      {/* Admin Preview Badge */}
      <div className="mb-6 flex items-center justify-between">
        <Badge variant="secondary" className="bg-orange-500/20 text-orange-600 border-orange-500/30">
          <Eye className="h-3 w-3 mr-1" />
          Admin Preview Mode
        </Badge>
        <Button
          onClick={() => router.push('/nucleus/admin/academy/courses')}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course Management
        </Button>
      </div>

      {/* Course Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              {course.topic && (
                <Badge variant="secondary">{course.topic}</Badge>
              )}
              <Badge variant={course.status === 'published' ? 'default' : 'outline'}>
                {course.status}
              </Badge>
              {course.qualityScore && course.qualityScore >= 80 && (
                <Badge className="bg-nex-gold-500 text-nex-dark hover:bg-nex-gold-600">
                  <Award className="h-3 w-3 mr-1" />
                  High Quality ({course.qualityScore})
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-headline mb-4 text-gold">
              {course.title}
            </h1>
            <p className="text-lg text-slate-dim mb-6">
              {course.description}
            </p>
          </div>
        </div>

        {/* Course Stats */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-dim">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>
              {durationHours > 0 && `${durationHours}h `}
              {durationMinutes}m
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <span>{course.modules?.length ?? 0} modules</span>
          </div>
          <div className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            <span>{totalLessons} activities</span>
          </div>
        </div>
      </div>

      {/* What You'll Build Section */}
      <Card className="mb-8 border-nex-light bg-gradient-to-br from-background to-cyan/5">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-cyan" />
            <CardTitle className="text-xl text-slate-light">Capabilities You'll Build</CardTitle>
          </div>
          <CardDescription className="text-slate-dim">
            Professional competencies students will develop through this pathway
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Generate learning objectives based on course content */}
            {course.modules?.slice(0, 3).map((module, idx) => (
              <div key={module.id} className="space-y-3">
                <h4 className="font-semibold text-sm text-slate-dim uppercase tracking-wider">
                  Module {idx + 1} Outcomes
                </h4>
                {module.lessons?.slice(0, 2).map((lesson) => (
                  <div key={lesson.id} className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-cyan mt-0.5 flex-shrink-0" />
                    <p className="text-sm">
                      {lesson.title.startsWith('Introduction to')
                        ? `Understand ${lesson.title.replace('Introduction to', '').toLowerCase()}`
                        : lesson.title.includes('Guide')
                        ? `Master ${lesson.title.replace('Guide', '').toLowerCase()} techniques`
                        : `Learn ${lesson.title.toLowerCase()}`}
                    </p>
                  </div>
                ))}
              </div>
            ))}

            {/* Additional course benefits */}
            <div className="lg:col-span-2 mt-4 pt-4 border-t">
              <h4 className="font-semibold text-sm text-slate-dim uppercase tracking-wider mb-3">
                Additional Benefits
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="h-4 w-4 text-nex-gold-500" />
                  <span>Certificate of Completion</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-cyan" />
                  <span>Career Advancement</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-cyan" />
                  <span>Industry Recognition</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-nex-gold-500" />
                  <span>Lifetime Access</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Main Content */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Course Curriculum</CardTitle>
              <CardDescription className="text-slate-dim">
                {course.modules?.length ?? 0} modules with {totalLessons} lessons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {course.modules?.map((module, moduleIndex) => (
                  <AccordionItem key={module.id} value={module.id}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-medium text-slate-dim">
                          Module {moduleIndex + 1}
                        </span>
                        <div>
                          <h3 className="font-semibold">{module.title}</h3>
                          <p className="text-sm text-slate-dim">
                            {module.lessons?.length ?? 0} lessons
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-slate-dim mb-4">
                        {module.description}
                      </p>
                      <ul className="space-y-2">
                        {module.lessons?.map((lesson, lessonIndex) => {
                          return (
                            <li
                              key={lesson.id}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <PlayCircle className="h-5 w-5 text-slate-dim flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">
                                    {lessonIndex + 1}. {lesson.title}
                                  </p>
                                  {lesson.videoUrl && (
                                    <Video className="h-3.5 w-3.5 text-cyan" />
                                  )}
                                </div>
                                <p className="text-sm text-slate-dim line-clamp-2">
                                  {lesson.description}
                                </p>
                                {lesson.videoDuration && (
                                  <p className="text-xs text-slate-dim mt-1">
                                    {Math.floor(lesson.videoDuration / 60)}:{String(lesson.videoDuration % 60).padStart(2, '0')} video
                                  </p>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-6">
            {/* Instructor Card */}
            {instructorInfo?.name && (
              <Card className="border-nex-light bg-gradient-to-br from-background to-cyan/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-light">
                    <User className="h-5 w-5 text-cyan" />
                    Instructor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    {instructorInfo.avatar && (
                      <img
                        src={instructorInfo.avatar}
                        alt={instructorInfo.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{instructorInfo.name}</h4>
                      {instructorInfo.email && (
                        <p className="text-xs text-slate-dim truncate">
                          {instructorInfo.email}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-slate-light">Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">Course ID</h4>
                  <p className="text-slate-dim font-mono text-xs">{course.id}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Quality Score</h4>
                  <p className="text-slate-dim">
                    {course.qualityScore ? `${course.qualityScore}/100` : 'Not Rated'}
                  </p>
                </div>
                {course.targetAudience && (
                  <div>
                    <h4 className="font-semibold mb-1">Target Audience</h4>
                    <p className="text-slate-dim">{course.targetAudience}</p>
                  </div>
                )}
                {course.domain && (
                  <div>
                    <h4 className="font-semibold mb-1">Domain</h4>
                    <p className="text-slate-dim">{course.domain}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Actions */}
            <Card className="border-orange-500/20 bg-gradient-to-br from-background to-orange-500/5">
              <CardHeader>
                <CardTitle className="text-lg text-slate-light">Admin Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <a href={`/nucleus/admin/academy/courses/${courseId}/edit`}>
                    Edit Course
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <a href={`/nucleus/academy/courses/${courseId}`} target="_blank" rel="noopener noreferrer">
                    View Public Page
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoursePreviewSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <Skeleton className="h-10 w-32 mb-6" />
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-full max-w-3xl mb-4" />
        <Skeleton className="h-20 w-full max-w-2xl mb-6" />
        <div className="flex gap-6 mb-6">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Skeleton className="h-[400px] w-full" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </div>
  );
}
