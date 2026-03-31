'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { logger } from '@/lib/logger';
const log = logger.scope('new/page');

export default function NewCoursePage() {
  const router = useRouter();

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field-specific validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    description?: string;
    topic?: string;
  }>({});

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [domain, setDomain] = useState('Healthcare');
  const [targetAudience, setTargetAudience] = useState('Healthcare Professionals');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [visibility, setVisibility] = useState<'internal' | 'public'>('internal');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  async function handleCreate() {
    // Clear previous errors
    setFieldErrors({});
    setError(null);

    // Validate all fields at once
    const errors: typeof fieldErrors = {};
    let hasErrors = false;

    if (!title.trim()) {
      errors.title = 'Course title is required';
      hasErrors = true;
    } else if (title.trim().length < 5) {
      errors.title = 'Course title must be at least 5 characters';
      hasErrors = true;
    }

    if (!description.trim()) {
      errors.description = 'Course description is required';
      hasErrors = true;
    } else if (description.trim().length < 20) {
      errors.description = 'Course description must be at least 20 characters';
      hasErrors = true;
    }

    if (!topic.trim()) {
      errors.topic = 'Course topic is required';
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(errors);
      setError('Please fix the errors below to continue');
      return;
    }

    setCreating(true);

    try {
      const { db, auth } = await import('@/lib/firebase');
      const { collection, addDoc, Timestamp } = await import('firebase/firestore');

      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Create course with empty modules array
      const courseData = {
        title: title.trim(),
        description: description.trim(),
        topic: topic.trim(),
        domain,
        targetAudience,
        difficulty,
        visibility,

        // Empty structure - will be filled by Module/Lesson editors
        modules: [],

        // Status
        status: 'draft',
        isPublished: false,
        publishedAt: null,

        // Metadata
        qualityScore: 0, // Will be calculated later
        metadata: {
          estimatedDuration: 0, // Will be calculated from lessons
          componentCount: 0,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
        },

        // Tracking
        userId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        version: 1,
      };

      const coursesRef = collection(db, 'courses');
      const docRef = await addDoc(coursesRef, courseData);

      // Redirect to edit page to add modules and lessons
      router.push(`/nucleus/admin/academy/courses/${docRef.id}/edit`);
    } catch (err) {
      log.error('Error creating course:', err);
      setError(err instanceof Error ? err.message : 'Failed to create course');
      setCreating(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-golden-2">
        <Button variant="ghost" asChild>
          <Link href="/nucleus/admin/academy/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course Management
          </Link>
        </Button>
      </div>
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 bg-gold/5">
            <Plus className="h-5 w-5 text-gold" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-gold/60">
              AlgoVigilance Admin
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Create New Course
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Start with basic course information, then add modules and lessons
        </p>
      </header>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Create Form */}
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-light">Basic Information</CardTitle>
            <CardDescription className="text-slate-dim">Core course details visible to practitioners</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: undefined }));
                }}
                placeholder="e.g., Signal Detection in Pharmacovigilance"
                required
                maxLength={200}
                className={fieldErrors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-dim">
                  {title.length}/200 characters
                </p>
                {fieldErrors.title && (
                  <p className="text-xs text-red-500 font-medium">{fieldErrors.title}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (fieldErrors.description) setFieldErrors(prev => ({ ...prev, description: undefined }));
                }}
                placeholder="Brief description of what practitioners will learn..."
                rows={4}
                required
                maxLength={1000}
                className={fieldErrors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-dim">
                  {description.length}/1000 characters
                </p>
                {fieldErrors.description && (
                  <p className="text-xs text-red-500 font-medium">{fieldErrors.description}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  if (fieldErrors.topic) setFieldErrors(prev => ({ ...prev, topic: undefined }));
                }}
                placeholder="e.g., Pharmacovigilance"
                required
                maxLength={100}
                className={fieldErrors.topic ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-dim">
                  Main subject area (used for filtering and recommendations)
                </p>
                {fieldErrors.topic && (
                  <p className="text-xs text-red-500 font-medium">{fieldErrors.topic}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categorization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-light">Categorization</CardTitle>
            <CardDescription className="text-slate-dim">Help practitioners find this course</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Select value={domain} onValueChange={setDomain}>
                <SelectTrigger>
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
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={(value) => setDifficulty(value as 'beginner' | 'intermediate' | 'advanced')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-dim">
                Helps practitioners find courses at their skill level
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Visibility & Media */}
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-light">Visibility & Media</CardTitle>
            <CardDescription className="text-slate-dim">Control who can see this course</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={(value) => setVisibility(value as 'internal' | 'public')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal (Members Only)</SelectItem>
                  <SelectItem value="public">Public (Anyone Can Enroll)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-dim">
                Internal courses are only visible to logged-in members
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL (Optional)</Label>
              <Input
                id="thumbnailUrl"
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-slate-dim">
                Course card image (recommended: 16:9 aspect ratio)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps Info */}
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardHeader>
            <CardTitle className="text-cyan-300 text-slate-light">Next Steps</CardTitle>
            <CardDescription className="text-cyan-400/70 text-slate-dim">
              After creating this course
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-cyan-400/80">
            <div className="flex items-start gap-2">
              <Plus className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Add modules to organize your content</span>
            </div>
            <div className="flex items-start gap-2">
              <Plus className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Create lessons with video, content, and quizzes</span>
            </div>
            <div className="flex items-start gap-2">
              <Plus className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Preview and publish when ready</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" asChild disabled={creating}>
            <Link href="/nucleus/admin/academy/courses">Cancel</Link>
          </Button>
          <Button onClick={handleCreate} disabled={creating} className="bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan">
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Course...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Course
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
