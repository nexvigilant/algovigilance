'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Plus, Eye, Trash2, HelpCircle } from 'lucide-react';
import { customToast } from '@/components/voice';
import { FileUpload } from '@/components/compositions/file-upload/FileUpload';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Timestamp } from 'firebase/firestore';
import type { Lesson, QuizQuestion, LessonResource } from '@/types/academy';
import { QuestionEditor } from './question-editor';

import { logger } from '@/lib/logger';
const log = logger.scope('lesson-dialog');

export function LessonDialog({
  open,
  onOpenChange,
  lesson,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson?: Lesson;
  onSave: (data: Partial<Lesson>) => void;
}) {
  // Basic lesson fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Quiz/Assessment fields
  const [hasAssessment, setHasAssessment] = useState(false);
  const [assessmentType, setAssessmentType] = useState<'quiz' | 'assignment' | 'project'>('quiz');
  const [passingScore, setPassingScore] = useState('70');
  const [maxAttempts, setMaxAttempts] = useState('0');
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeOptions, setRandomizeOptions] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Resources
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [uploadingResource, setUploadingResource] = useState(false);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title || '');
      setDescription(lesson.description || '');
      setContent(lesson.content || '');
      setEstimatedDuration(lesson.estimatedDuration?.toString() || '');
      setVideoUrl(lesson.videoUrl || '');

      // Load assessment if exists
      if (lesson.assessment) {
        setHasAssessment(true);
        setAssessmentType(lesson.assessment.type);
        setPassingScore(lesson.assessment.passingScore?.toString() || '70');
        setMaxAttempts(lesson.assessment.maxAttempts?.toString() || '0');
        setRandomizeQuestions(lesson.assessment.randomizeQuestions || false);
        setRandomizeOptions(lesson.assessment.randomizeOptions || false);
        setQuestions([...(lesson.assessment.questions || [])]);
      } else {
        setHasAssessment(false);
        setQuestions([]);
      }

      // Load resources
      setResources([...(lesson.resources || [])]);
    } else {
      setTitle('');
      setDescription('');
      setContent('');
      setEstimatedDuration('');
      setVideoUrl('');
      setHasAssessment(false);
      setQuestions([]);
      setResources([]);
    }
  }, [lesson, open]);

  function addQuestion() {
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1,
    };
    setQuestions([...questions, newQuestion]);
  }

  function updateQuestion(index: number, updates: Partial<QuizQuestion>) {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates } as QuizQuestion;
    setQuestions(newQuestions);
  }

  function deleteQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  // Resource functions
  async function handleResourceUpload(file: File): Promise<string> {
    setUploadingResource(true);
    try {
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `courses/resources/${timestamp}_${safeFileName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Determine file type
      const ext = file.name.split('.').pop()?.toLowerCase() || 'other';
      const fileType = ['pdf', 'docx', 'xlsx', 'pptx', 'zip'].includes(ext)
        ? ext as LessonResource['fileType']
        : 'other';

      // Add to resources list
      const newResource: LessonResource = {
        id: `res-${timestamp}`,
        title: file.name,
        fileType,
        fileUrl: url,
        fileSize: file.size,
        uploadedAt: Timestamp.now(),
      };

      setResources(prev => [...prev, newResource]);
      return url;
    } finally {
      setUploadingResource(false);
    }
  }

  async function handleDeleteResource(resourceId: string, fileUrl: string) {
    if (!confirm('Delete this resource?')) return;

    try {
      // Try to delete from Storage (may fail if URL format differs)
      try {
        const storageRef = ref(storage, fileUrl);
        await deleteObject(storageRef);
      } catch {
        // File may already be deleted or URL format differs - continue anyway
      }

      // Remove from local state
      setResources(prev => prev.filter(r => r.id !== resourceId));
    } catch (error) {
      log.error('Error deleting resource:', error);
      customToast.error('Failed to delete resource');
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  function handleSave() {
    if (!title.trim()) {
      customToast.warning('Lesson title is required');
      return;
    }

    const videoProvider = videoUrl.includes('vimeo') ? 'vimeo'
      : videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? 'youtube'
      : videoUrl.includes('bunny') ? 'bunny'
      : videoUrl.includes('cloudflare') ? 'cloudflare'
      : undefined;

    const lessonData: Partial<Lesson> = {
      title: title.trim(),
      description: description.trim(),
      content: content.trim(),
      estimatedDuration: parseInt(estimatedDuration) || 0,
      videoUrl: videoUrl.trim() || undefined,
      videoProvider,
      assessment: (hasAssessment && questions.length > 0) ? {
        type: assessmentType,
        passingScore: parseInt(passingScore) || 70,
        maxAttempts: parseInt(maxAttempts) || 0,
        randomizeQuestions,
        randomizeOptions,
        questions,
      } : undefined,
      resources: resources.length > 0 ? resources : undefined,
    };

    onSave(lessonData);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lesson ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
          <DialogDescription>
            Create engaging learning content with optional assessment
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="assessment">
              Assessment {hasAssessment && <Badge className="ml-2" variant="secondary">{questions.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="resources">
              Resources {resources.length > 0 && <Badge className="ml-2" variant="secondary">{resources.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Lesson Title *</Label>
              <Input
                id="lesson-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Understanding Adverse Events"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-description">Description</Label>
              <Textarea
                id="lesson-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will practitioners learn in this lesson?"
                rows={2}
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-content">Content (Markdown)</Label>
              <Textarea
                id="lesson-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your lesson content using markdown..."
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-dim">
                Use markdown for formatting. Supports headings, lists, bold, italic, links, etc.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-duration">Duration (minutes)</Label>
                <Input
                  id="lesson-duration"
                  type="number"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  placeholder="15"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-video">Video URL (Optional)</Label>
                <Input
                  id="lesson-video"
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://vimeo.com/..."
                />
              </div>
            </div>
          </TabsContent>

          {/* Assessment Tab */}
          <TabsContent value="assessment" className="space-y-4 mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-assessment"
                checked={hasAssessment}
                onCheckedChange={(checked) => setHasAssessment(checked as boolean)}
              />
              <Label htmlFor="has-assessment" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Add assessment to this lesson
              </Label>
            </div>

            {hasAssessment && (
              <>
                <Separator />

                {/* Quiz Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Assessment Type</Label>
                    <Select value={assessmentType} onValueChange={(value) => setAssessmentType(value as 'quiz' | 'assignment' | 'project')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passing-score">Passing Score (%)</Label>
                    <Input
                      id="passing-score"
                      type="number"
                      value={passingScore}
                      onChange={(e) => setPassingScore(e.target.value)}
                      min="0"
                      max="100"
                      placeholder="70"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-attempts">Max Attempts (0 = unlimited)</Label>
                    <Input
                      id="max-attempts"
                      type="number"
                      value={maxAttempts}
                      onChange={(e) => setMaxAttempts(e.target.value)}
                      min="0"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-3 pt-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="randomize-questions"
                        checked={randomizeQuestions}
                        onCheckedChange={(checked) => setRandomizeQuestions(checked as boolean)}
                      />
                      <Label htmlFor="randomize-questions" className="text-sm">Randomize questions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="randomize-options"
                        checked={randomizeOptions}
                        onCheckedChange={(checked) => setRandomizeOptions(checked as boolean)}
                      />
                      <Label htmlFor="randomize-options" className="text-sm">Randomize answer options</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Questions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Questions ({questions.length})</Label>
                    <Button onClick={addQuestion} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Question
                    </Button>
                  </div>

                  {questions.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <HelpCircle className="h-8 w-8 mx-auto mb-2 text-slate-dim" />
                      <p className="text-sm text-slate-dim">No questions yet</p>
                      <Button onClick={addQuestion} size="sm" variant="outline" className="mt-2">
                        <Plus className="h-4 w-4 mr-1" />
                        Create First Question
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {questions.map((q, idx) => (
                        <QuestionEditor
                          key={q.id}
                          question={q}
                          index={idx}
                          onUpdate={(updates) => updateQuestion(idx, updates)}
                          onDelete={() => deleteQuestion(idx)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Downloadable Resources</Label>
              <p className="text-xs text-slate-dim">
                Add PDFs, documents, spreadsheets, or other files for practitioners to download.
              </p>
            </div>

            {/* File Upload */}
            <FileUpload
              accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.zip"
              maxSize={50 * 1024 * 1024} // 50MB
              multiple={true}
              showPreview={false}
              onUpload={handleResourceUpload}
              onError={(error, file) => customToast.error(`Error uploading ${file.name}: ${error.message}`)}
              disabled={uploadingResource}
              dragDropText="Drag and drop files here, or click to select"
              className="mb-4"
            />

            {/* Existing Resources */}
            {resources.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Resources ({resources.length})</Label>
                <div className="space-y-2">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center bg-slate-dim/20 rounded">
                          <span className="text-xs font-mono uppercase">{resource.fileType}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{resource.title}</p>
                          <p className="text-xs text-slate-dim">{formatFileSize(resource.fileSize)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(resource.fileUrl, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteResource(resource.id, resource.fileUrl)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resources.length === 0 && !uploadingResource && (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-sm text-slate-dim">No resources added yet</p>
                <p className="text-xs text-slate-dim mt-1">
                  Upload files using the area above
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {lesson ? 'Save Changes' : 'Add Lesson'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
