'use client';

import { useState, useEffect } from 'react';
import { type Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { ArrowLeft, Upload, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, query, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { Course, Lesson, LessonResource } from '@/types/academy';
import { addResourceToLesson, deleteResourceFromLesson } from '../courses/[id]/edit/resource-actions';

import { logger } from '@/lib/logger';
const log = logger.scope('resources/page');

export default function ResourceManagementPage() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number>(-1);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Upload form fields
  const [file, setFile] = useState<File | null>(null);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');

  // Load courses
  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    try {
      const coursesQuery = query(collection(db, 'courses'));
      const snapshot = await getDocs(coursesQuery);
      const coursesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Course));
      setCourses(coursesData.sort((a, b) => a.title.localeCompare(b.title)));
    } catch (err) {
      log.error('Error loading courses:', err);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }

  async function handleCourseSelect(courseId: string) {
    const course = courses.find(c => c.id === courseId);
    setSelectedCourse(course || null);
    setSelectedModuleIndex(-1);
    setSelectedLessonIndex(-1);
  }

  function getSelectedLesson(): Lesson | null {
    if (!selectedCourse || selectedModuleIndex === -1 || selectedLessonIndex === -1) {
      return null;
    }
    return selectedCourse.modules[selectedModuleIndex]?.lessons[selectedLessonIndex] || null;
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function getFileType(filename: string): LessonResource['fileType'] {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'pdf';
      case 'docx':
      case 'doc':
        return 'docx';
      case 'xlsx':
      case 'xls':
        return 'xlsx';
      case 'pptx':
      case 'ppt':
        return 'pptx';
      case 'zip':
        return 'zip';
      default:
        return 'other';
    }
  }

  async function handleUpload() {
    if (!file || !resourceTitle.trim() || !selectedCourse || selectedModuleIndex === -1 || selectedLessonIndex === -1) {
      setError('Please select a course, module, lesson, file, and provide a title');
      return;
    }

    setError(null);
    setSuccess(null);
    setUploading(true);

    try {
      // Create storage path: courses/{courseId}/resources/{timestamp}_{filename}
      const timestamp = Date.now();
      const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `courses/${selectedCourse.id}/resources/${timestamp}_${filename}`;
      const storageRef = ref(storage, storagePath);

      // Upload file
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      // Create resource metadata
      const resource: Omit<LessonResource, 'uploadedAt'> & { uploadedAt?: Timestamp } = {
        id: `resource-${timestamp}`,
        title: resourceTitle.trim(),
        description: resourceDescription.trim() || undefined,
        fileType: getFileType(file.name),
        fileUrl,
        fileSize: file.size,
        downloadCount: 0,
      };

      // Add resource to lesson
      const result = await addResourceToLesson(
        selectedCourse.id,
        selectedModuleIndex,
        selectedLessonIndex,
        resource
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to add resource');
      }

      setSuccess(`Resource "${resourceTitle}" uploaded successfully!`);

      // Reset form
      setFile(null);
      setResourceTitle('');
      setResourceDescription('');

      // Reload course to show new resource
      await reloadCourse();
    } catch (err) {
      log.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload resource');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(resource: LessonResource) {
    if (!selectedCourse || selectedModuleIndex === -1 || selectedLessonIndex === -1) {
      return;
    }

    if (!confirm(`Delete "${resource.title}"? This cannot be undone.`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      // Delete from Firestore
      const result = await deleteResourceFromLesson(
        selectedCourse.id,
        selectedModuleIndex,
        selectedLessonIndex,
        resource.id
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete resource');
      }

      // Delete from Storage
      try {
        const storageRef = ref(storage, resource.fileUrl);
        await deleteObject(storageRef);
      } catch (storageErr) {
        log.warn('Failed to delete file from storage:', storageErr);
        // Continue anyway - metadata is already deleted
      }

      setSuccess(`Resource "${resource.title}" deleted`);
      await reloadCourse();
    } catch (err) {
      log.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete resource');
    }
  }

  async function reloadCourse() {
    if (!selectedCourse) return;

    try {
      const courseDoc = await getDoc(doc(db, 'courses', selectedCourse.id));
      if (courseDoc.exists()) {
        const updatedCourse = {
          id: courseDoc.id,
          ...courseDoc.data()
        } as Course;
        setSelectedCourse(updatedCourse);
        // Update in courses array too
        setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
      }
    } catch (err) {
      log.error('Error reloading course:', err);
    }
  }

  const selectedLesson = getSelectedLesson();
  const resources = selectedLesson?.resources || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/nucleus/admin/academy">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Academy Admin
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline mb-2 text-gold">Resource Management</h1>
            <p className="text-slate-dim">
              Upload and manage downloadable resources for lessons
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500 bg-green-500/10 text-green-400">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Selection Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-slate-light">Select Lesson</CardTitle>
          <CardDescription className="text-slate-dim">Choose the lesson to manage resources for</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Course Select */}
            <div className="space-y-2">
              <Label>Course</Label>
              <Select
                value={selectedCourse?.id || ''}
                onValueChange={handleCourseSelect}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Module Select */}
            <div className="space-y-2">
              <Label>Module</Label>
              <Select
                value={selectedModuleIndex >= 0 ? selectedModuleIndex.toString() : ''}
                onValueChange={(value) => {
                  setSelectedModuleIndex(parseInt(value));
                  setSelectedLessonIndex(-1);
                }}
                disabled={!selectedCourse}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCourse?.modules.map((module, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lesson Select */}
            <div className="space-y-2">
              <Label>Lesson</Label>
              <Select
                value={selectedLessonIndex >= 0 ? selectedLessonIndex.toString() : ''}
                onValueChange={(value) => setSelectedLessonIndex(parseInt(value))}
                disabled={selectedModuleIndex === -1}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a lesson" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCourse?.modules[selectedModuleIndex]?.lessons.map((lesson, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      {selectedLesson && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-slate-light">Upload New Resource</CardTitle>
              <CardDescription className="text-slate-dim">
                Add a downloadable file for "{selectedLesson.title}"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.zip"
                />
                <p className="text-xs text-slate-dim">
                  Supported: PDF, Word, Excel, PowerPoint, ZIP
                </p>
                {file && (
                  <Badge variant="outline" className="mt-2">
                    {file.name} ({formatFileSize(file.size)})
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Resource Title *</Label>
                <Input
                  id="title"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="e.g., MedDRA Quick Reference Guide"
                  maxLength={100}
                  disabled={uploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={resourceDescription}
                  onChange={(e) => setResourceDescription(e.target.value)}
                  placeholder="Brief description of this resource..."
                  rows={2}
                  maxLength={200}
                  disabled={uploading}
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={!file || !resourceTitle.trim() || uploading}
                className="w-full bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Resource
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resources List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Existing Resources ({resources.length})</CardTitle>
              <CardDescription className="text-slate-dim">
                Resources for "{selectedLesson.title}"
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resources.length === 0 ? (
                <div className="text-center py-8 text-slate-dim">
                  No resources yet. Upload one above to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table aria-label="Lesson downloadable resources">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Downloads</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resources.map((resource) => (
                        <TableRow key={resource.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{resource.title}</p>
                              {resource.description && (
                                <p className="text-sm text-slate-dim">{resource.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{resource.fileType.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-dim">
                            {formatFileSize(resource.fileSize)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-dim">
                            {resource.downloadCount || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" asChild>
                                <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(resource)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* No Selection State */}
      {!selectedLesson && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-slate-dim">
            Select a course, module, and lesson above to manage resources
          </CardContent>
        </Card>
      )}
    </div>
  );
}
