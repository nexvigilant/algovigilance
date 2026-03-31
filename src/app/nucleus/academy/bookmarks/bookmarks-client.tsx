"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bookmark,
  Trash2,
  ExternalLink,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { VoiceEmptyState } from "@/components/voice";

import { logger } from "@/lib/logger";
const log = logger.scope("bookmarks-client");
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getUserBookmarks, deleteBookmark } from "./bookmarks-actions";
import type { LessonBookmark } from "@/types/academy";
import { formatBookmarkDate } from "@/lib/data/bookmarks";

export function BookmarksClient() {
  const [bookmarks, setBookmarks] = useState<LessonBookmark[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookmarkToDelete, setBookmarkToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const data = await getUserBookmarks();
        setBookmarks(data);
      } catch (error) {
        log.error("Failed to fetch bookmarks:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBookmarks();
  }, []);

  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.lessonTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.note?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  function handleDeleteBookmark(bookmarkId: string) {
    setBookmarkToDelete(bookmarkId);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (bookmarkToDelete) {
      try {
        const success = await deleteBookmark(bookmarkToDelete);
        if (success) {
          setBookmarks(bookmarks.filter((b) => b.id !== bookmarkToDelete));
        }
      } catch (error) {
        log.error("Failed to delete bookmark:", error);
      } finally {
        setBookmarkToDelete(null);
        setDeleteDialogOpen(false);
      }
    }
  }

  function toggleNoteExpansion(bookmarkId: string) {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(bookmarkId)) {
      newExpanded.delete(bookmarkId);
    } else {
      newExpanded.add(bookmarkId);
    }
    setExpandedNotes(newExpanded);
  }

  // Helper: Check if note should show truncation
  const shouldTruncate = (note: string): boolean => {
    return note.length > 150;
  };

  // Helper: Get truncated note text
  const getTruncatedNote = (note: string): string => {
    if (!shouldTruncate(note)) return note;
    return note.substring(0, 150).trim() + "...";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline mb-2 text-gold">
          My Bookmarks
        </h1>
        <p className="text-slate-dim">
          Quick access to lessons you've saved for later
        </p>
      </div>

      {loading ? (
        <>
          {/* Search Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-10 w-full max-w-md" />
          </div>

          {/* Statistics Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bookmarks List Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-3" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                </CardHeader>
                <CardFooter className="pt-0">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Search */}
          <div className="mb-6">
            <Input
              placeholder="Search bookmarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <Bookmark className="h-4 w-4 text-cyan" />
                  <div className="text-2xl font-bold text-cyan">
                    {bookmarks.length}
                  </div>
                </div>
                <p className="text-sm text-slate-dim">Total Bookmarks</p>
              </CardContent>
            </Card>

            <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-cyan">
                  {new Set(bookmarks.map((b) => b.courseId)).size}
                </div>
                <p className="text-sm text-slate-dim">Courses</p>
              </CardContent>
            </Card>

            <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-cyan">
                  {bookmarks.filter((b) => b.note).length}
                </div>
                <p className="text-sm text-slate-dim">With Notes</p>
              </CardContent>
            </Card>
          </div>

          {/* Bookmarks List */}
          {filteredBookmarks.length === 0 ? (
            <VoiceEmptyState
              context="bookmarks"
              title={
                searchTerm
                  ? "No bookmarks match your search"
                  : "No bookmarks yet"
              }
              description={
                searchTerm
                  ? "Try adjusting your search"
                  : "Bookmark lessons while learning to save them for quick access"
              }
              variant="card"
              size="lg"
              action={
                !searchTerm
                  ? {
                      label: "Browse Courses",
                      href: "/nucleus/academy",
                    }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredBookmarks.map((bookmark) => (
                <Card
                  key={bookmark.id}
                  className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Bookmark className="h-4 w-4 text-cyan" />
                          <Badge variant="outline" className="text-xs">
                            {bookmark.courseTitle}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg text-slate-light">
                          {bookmark.lessonTitle}
                        </CardTitle>
                        {bookmark.note && (
                          <div className="mt-3">
                            <CardDescription className="italic break-words whitespace-normal text-slate-dim">
                              Note:{" "}
                              {expandedNotes.has(bookmark.id)
                                ? bookmark.note
                                : getTruncatedNote(bookmark.note)}
                            </CardDescription>
                            {shouldTruncate(bookmark.note) && (
                              <button
                                onClick={() => toggleNoteExpansion(bookmark.id)}
                                className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
                              >
                                {expandedNotes.has(bookmark.id) ? (
                                  <>
                                    <span>Show less</span>
                                    <ChevronUp className="h-3 w-3" />
                                  </>
                                ) : (
                                  <>
                                    <span>Read more</span>
                                    <ChevronDown className="h-3 w-3" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/nucleus/academy/build/${bookmark.courseId}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBookmark(bookmark.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-slate-dim">
                      <Calendar className="h-4 w-4 mr-1 text-cyan" />
                      Bookmarked on {formatBookmarkDate(bookmark.createdAt)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Bookmark?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the bookmark from your saved lessons. You can
              always bookmark it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
