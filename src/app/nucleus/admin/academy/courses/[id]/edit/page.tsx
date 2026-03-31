'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Plus, GripVertical, Pencil, Trash2, Eye, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { VoiceLoading, VoiceEmptyState } from '@/components/voice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import type { Course, Module, Lesson } from '@/types/academy';

import { logger } from '@/lib/logger';
import { ModuleDialog } from './components/module-dialog';
import { LessonDialog } from './components/lesson-dialog';
const log = logger.scope('edit/page');

export default function CourseEditPage() {
  const _router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  // UI state
  const [courseInfoExpanded, setCourseInfoExpanded] = useState(false);

  // Module/Lesson editors
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<{ index: number; module: Module } | null>(null);
  const [editingLesson, setEditingLesson] = useState<{ moduleIndex: number; lessonIndex: number; lesson: Lesson } | null>(null);

  // Load course
  useEffect(() => {
    loadCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function loadCourse() {
    setLoading(true);
    setError(null);
    try {
      const courseRef = doc(db, 'courses', courseId);
      const courseSnap = await getDoc(courseRef);

      if (!courseSnap.exists()) {
        setError('Course not found');
        return;
      }

      const data = courseSnap.data();
      setCourse({
        id: courseSnap.id,
        ...data,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        publishedAt: data.publishedAt || null,
      } as Course);
    } catch (err) {
      log.error('Error loading course:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  }

  async function saveCourse() {
    if (!course) return;

    setSaving(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Calculate metadata
      const totalDuration = course.modules.reduce((total, module) => {
        return total + module.lessons.reduce((moduleTotal, lesson) => {
          return moduleTotal + (lesson.estimatedDuration || 0);
        }, 0);
      }, 0);

      const componentCount = course.modules.reduce((total, module) => {
        return total + module.lessons.length;
      }, 0);

      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        // Basic info
        title: course.title,
        description: course.description,
        topic: course.topic,
        domain: course.domain,
        targetAudience: course.targetAudience,
        difficulty: course.difficulty,
        visibility: course.visibility,
        // Content
        modules: course.modules,
        // Metadata
        metadata: {
          ...course.metadata,
          estimatedDuration: totalDuration,
          componentCount,
        },
        updatedAt: Timestamp.now(),
        version: course.version + 1,
      });

      // Refresh course
      await loadCourse();

      setError(null);
    } catch (err) {
      log.error('Error saving course:', err);
      setError(err instanceof Error ? err.message : 'Failed to save course');
    } finally {
      setSaving(false);
    }
  }

  // Module operations
  function addModule() {
    setEditingModule(null);
    setModuleDialogOpen(true);
  }

  function editModule(index: number) {
    if (!course) return;
    setEditingModule({ index, module: course.modules[index] });
    setModuleDialogOpen(true);
  }

  function deleteModule(index: number) {
    if (!course) return;
    if (!confirm('Delete this module and all its lessons?')) return;

    const newModules = [...course.modules];
    newModules.splice(index, 1);
    setCourse({ ...course, modules: newModules });
  }

  function moveModule(index: number, direction: 'up' | 'down') {
    if (!course) return;
    const newModules = [...course.modules];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newModules.length) return;

    [newModules[index], newModules[targetIndex]] = [newModules[targetIndex], newModules[index]];
    setCourse({ ...course, modules: newModules });
  }

  function saveModule(moduleData: Partial<Module>) {
    if (!course) return;

    const newModules = [...course.modules];

    if (editingModule !== null) {
      // Edit existing
      newModules[editingModule.index] = {
        ...newModules[editingModule.index],
        ...moduleData,
      };
    } else {
      // Add new
      newModules.push({
        id: `module-${Date.now()}`,
        title: moduleData.title || '',
        description: moduleData.description || '',
        lessons: [],
      });
    }

    setCourse({ ...course, modules: newModules });
    setModuleDialogOpen(false);
    setEditingModule(null);
  }

  // Lesson operations
  function addLesson(moduleIndex: number) {
    setEditingLesson({ moduleIndex, lessonIndex: -1, lesson: {} as Lesson });
    setLessonDialogOpen(true);
  }

  function editLesson(moduleIndex: number, lessonIndex: number) {
    if (!course) return;
    setEditingLesson({
      moduleIndex,
      lessonIndex,
      lesson: course.modules[moduleIndex]?.lessons[lessonIndex],
    });
    setLessonDialogOpen(true);
  }

  function deleteLesson(moduleIndex: number, lessonIndex: number) {
    if (!course) return;
    if (!confirm('Delete this lesson?')) return;

    const newModules = [...course.modules];
    const mutableLessons = [...newModules[moduleIndex].lessons];
    mutableLessons.splice(lessonIndex, 1);
    newModules[moduleIndex] = { ...newModules[moduleIndex], lessons: mutableLessons };
    setCourse({ ...course, modules: newModules });
  }

  function saveLesson(lessonData: Partial<Lesson>) {
    if (!course || !editingLesson) return;

    const newModules = [...course.modules];
    const { moduleIndex, lessonIndex } = editingLesson;
    const mutableLessons = [...newModules[moduleIndex].lessons];

    if (lessonIndex === -1) {
      // Add new
      mutableLessons.push({
        id: `lesson-${Date.now()}`,
        title: lessonData.title || '',
        description: lessonData.description || '',
        content: lessonData.content || '',
        estimatedDuration: lessonData.estimatedDuration || 0,
        videoUrl: lessonData.videoUrl,
        videoDuration: lessonData.videoDuration,
        videoProvider: lessonData.videoProvider,
      });
    } else {
      // Edit existing
      mutableLessons[lessonIndex] = {
        ...mutableLessons[lessonIndex],
        ...lessonData,
      };
    }

    newModules[moduleIndex] = { ...newModules[moduleIndex], lessons: mutableLessons };
    setCourse({ ...course, modules: newModules });
    setLessonDialogOpen(false);
    setEditingLesson(null);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <VoiceLoading context="admin" variant="fullpage" message="Loading course editor..." />
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/nucleus/admin/academy/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-2 text-gold">Edit Course</h1>
            <p className="text-slate-dim">{course.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href={`/nucleus/admin/academy/courses/${courseId}/preview`}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Link>
            </Button>
            <Button onClick={saveCourse} disabled={saving} className="bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Course Info - Collapsible */}
      <Collapsible open={courseInfoExpanded} onOpenChange={setCourseInfoExpanded} className="mb-6">
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
                      onChange={(e) => setCourse({ ...course, title: e.target.value })}
                      placeholder="e.g., Signal Detection in Pharmacovigilance"
                      maxLength={200}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-description">Description</Label>
                    <Textarea
                      id="course-description"
                      value={course.description}
                      onChange={(e) => setCourse({ ...course, description: e.target.value })}
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
                        onChange={(e) => setCourse({ ...course, topic: e.target.value })}
                        placeholder="e.g., Pharmacovigilance"
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="course-difficulty">Difficulty Level</Label>
                      <Select
                        value={course.difficulty || 'intermediate'}
                        onValueChange={(value) => setCourse({ ...course, difficulty: value as 'beginner' | 'intermediate' | 'advanced' })}
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
                      onValueChange={(value) => setCourse({ ...course, domain: value })}
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
                      onValueChange={(value) => setCourse({ ...course, targetAudience: value })}
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
                    onValueChange={(value) => setCourse({ ...course, visibility: value as 'internal' | 'public' })}
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

      {/* Modules Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-light">Course Content</CardTitle>
              <CardDescription className="text-slate-dim">Organize your course into modules and lessons</CardDescription>
            </div>
            <Button onClick={addModule}>
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
                onClick: addModule,
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
                          onClick={() => moveModule(moduleIndex, 'up')}
                          disabled={moduleIndex === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <GripVertical className="h-4 w-4 text-slate-dim" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => moveModule(moduleIndex, 'down')}
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
                              onClick={() => editModule(moduleIndex)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteModule(moduleIndex)}
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
                    {/* Lessons */}
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
                              onClick={() => editLesson(moduleIndex, lessonIndex)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLesson(moduleIndex, lessonIndex)}
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
                        onClick={() => addLesson(moduleIndex)}
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

      {/* Module Dialog */}
      <ModuleDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        module={editingModule?.module}
        onSave={saveModule}
      />

      {/* Lesson Dialog */}
      <LessonDialog
        open={lessonDialogOpen}
        onOpenChange={setLessonDialogOpen}
        lesson={editingLesson?.lesson}
        onSave={saveLesson}
      />
    </div>
  );
}
