'use client';

import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { StickyNote, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { LessonNote } from '@/types/academy';
import { toDateFromSerialized } from '@/types/academy';
import { VoiceEmptyState } from '@/components/voice';
import {
  getLessonNotes,
  createLessonNote,
  updateLessonNote,
  deleteLessonNote
} from './lesson-notes-actions';

import { logger } from '@/lib/logger';
const log = logger.scope('components/lesson-notes');

interface LessonNotesProps {
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  courseTitle: string;
  currentVideoTime?: number;
}

export function LessonNotes({
  lessonId,
  courseId,
  lessonTitle,
  courseTitle,
  currentVideoTime,
}: LessonNotesProps) {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<LessonNote | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadNotes() {
      try {
        const fetchedNotes = await getLessonNotes(courseId, lessonId);
        setNotes(fetchedNotes);
      } catch (error) {
        log.error('Failed to fetch notes', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadNotes();
  }, [courseId, lessonId]);

  async function handleCreateNote() {
    if (!noteContent.trim()) return;

    setSaving(true);
    try {
      const newNote = await createLessonNote({
        courseId,
        lessonId,
        lessonTitle,
        courseTitle,
        content: noteContent,
        videoTimestamp: currentVideoTime,
      });

      if (newNote) {
        setNotes([newNote, ...notes]);
        setNoteContent('');
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      log.error('Failed to create note', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateNote() {
    if (!editingNote || !noteContent.trim()) return;

    setSaving(true);
    try {
      const success = await updateLessonNote(editingNote.id, noteContent);
      if (success) {
        setNotes(
          notes.map((n) =>
            n.id === editingNote.id
              ? { ...n, content: noteContent, updatedAt: Timestamp.now() }
              : n
          )
        );
        setEditingNote(null);
        setNoteContent('');
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      log.error('Failed to update note', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const success = await deleteLessonNote(noteId);
      if (success) {
        setNotes(notes.filter((n) => n.id !== noteId));
      }
    } catch (error) {
      log.error('Failed to delete note', error);
    }
  }

  function formatTimestamp(seconds?: number): string {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function openCreateDialog() {
    setNoteContent('');
    setEditingNote(null);
    setIsCreateDialogOpen(true);
  }

  function openEditDialog(note: LessonNote) {
    setNoteContent(note.content);
    setEditingNote(note);
    setIsCreateDialogOpen(true);
  }

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              My Notes ({notes.length})
            </CardTitle>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <VoiceEmptyState
              context="notes"
              title="No notes yet"
              description="Capture your key takeaways from this lesson"
              variant="inline"
              size="sm"
              action={{
                label: 'Create Your First Note',
                onClick: openCreateDialog,
              }}
            />
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {note.videoTimestamp !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          {formatTimestamp(note.videoTimestamp)}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {toDateFromSerialized(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(note)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Note Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'Create Note'}</DialogTitle>
            <DialogDescription>
              {editingNote
                ? 'Update your note for this lesson'
                : currentVideoTime
                ? `Add a note at ${formatTimestamp(currentVideoTime)}`
                : 'Add a note for this lesson'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your note here..."
              className="min-h-[150px]"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNoteContent('');
                setEditingNote(null);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={editingNote ? handleUpdateNote : handleCreateNote}
              disabled={!noteContent.trim() || saving}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingNote ? 'Update' : 'Save'} Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
