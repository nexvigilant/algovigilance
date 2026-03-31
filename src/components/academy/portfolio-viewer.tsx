'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase,
  Search,
  Calendar,
  Trophy,
  CheckCircle2,
  Clock,
  Filter,
  FileText,
  Target,
  MessageCircle,
} from 'lucide-react';
import type { PortfolioArtifact } from '@/types/pv-curriculum';
import { getPortfolioArtifacts } from '@/app/nucleus/academy/portfolio/actions';

interface PortfolioViewerProps {
  userId: string;
}

const artifactTypeIcons = {
  completion: CheckCircle2,
  creation: FileText,
  analysis: Target,
  decision_log: MessageCircle,
};

const artifactTypeLabels = {
  completion: 'Completion',
  creation: 'Creation',
  analysis: 'Analysis',
  decision_log: 'Decision Log',
};

/**
 * Safely convert Firestore timestamps, Date objects, or ISO strings to Date
 * Handles server action serialization where Timestamps become plain objects
 */
const toDate = (
  value: Date | { seconds: number; nanoseconds?: number } | string | undefined | null
): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  // Firestore Timestamp serialized as { seconds, nanoseconds }
  if (typeof value === 'object' && 'seconds' in value) {
    return new Date(value.seconds * 1000);
  }
  return new Date();
};

export function PortfolioViewer({ userId }: PortfolioViewerProps) {
  const [artifacts, setArtifacts] = useState<PortfolioArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedArtifact, setSelectedArtifact] = useState<PortfolioArtifact | null>(null);

  // Refs for modal accessibility
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key for modal
  useEffect(() => {
    if (!selectedArtifact) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedArtifact(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedArtifact]);

  // Focus management for modal
  useEffect(() => {
    if (selectedArtifact) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the modal
      modalRef.current?.focus();
    } else if (previousFocusRef.current) {
      // Restore focus when modal closes
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [selectedArtifact]);

  const loadArtifacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPortfolioArtifacts(userId);
      if (result.success && result.artifacts) {
        setArtifacts(result.artifacts);
      } else {
        setError(result.error || 'Failed to load portfolio');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadArtifacts();
  }, [loadArtifacts]);

  // Filter artifacts with useMemo for performance
  const filteredArtifacts = useMemo(() => {
    let filtered = [...artifacts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.competencyTags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((a) => a.artifactType === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    return filtered;
  }, [artifacts, searchQuery, typeFilter, statusFilter]);

  // Calculate stats with proper division by zero handling
  const stats = useMemo(() => {
    const artifactsWithScores = artifacts.filter((a) => a.activityResults?.score !== undefined);
    const totalScore = artifactsWithScores.reduce(
      (sum, a) => sum + (a.activityResults?.score || 0),
      0
    );

    return {
      total: artifacts.length,
      verified: artifacts.filter((a) => a.status === 'verified').length,
      submitted: artifacts.filter((a) => a.status === 'submitted').length,
      avgScore: artifactsWithScores.length > 0
        ? Math.round(totalScore / artifactsWithScores.length)
        : 0,
    };
  }, [artifacts]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading portfolio...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={loadArtifacts} variant="outline" className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Artifacts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.verified}</div>
                <div className="text-xs text-muted-foreground">Verified</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{stats.submitted}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.avgScore}%</div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or competency tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="completion">Completion</SelectItem>
                <SelectItem value="creation">Creation</SelectItem>
                <SelectItem value="analysis">Analysis</SelectItem>
                <SelectItem value="decision_log">Decision Log</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Artifacts Grid */}
      {filteredArtifacts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Artifacts Found</h3>
            <p className="text-muted-foreground">
              {artifacts.length === 0
                ? 'Complete KSB activities to build your portfolio.'
                : 'Try adjusting your filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredArtifacts.map((artifact) => {
            const Icon = artifactTypeIcons[artifact.artifactType];
            return (
              <Card
                key={artifact.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedArtifact(artifact)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">
                        {artifactTypeLabels[artifact.artifactType]}
                      </Badge>
                    </div>
                    <Badge
                      variant={
                        artifact.status === 'verified'
                          ? 'default'
                          : artifact.status === 'submitted'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {artifact.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{artifact.title}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {toDate(artifact.createdAt).toLocaleDateString()}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {artifact.competencyTags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {artifact.competencyTags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{artifact.competencyTags.length - 3}
                      </Badge>
                    )}
                  </div>
                  {artifact.activityResults && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Score: {artifact.activityResults.score.toFixed(0)}%
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Artifact Detail Modal */}
      {selectedArtifact && (
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="artifact-modal-title"
          tabIndex={-1}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedArtifact(null)}
          onKeyDown={(e) => {
            // Trap focus within modal
            if (e.key === 'Tab') {
              const focusableElements = modalRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
              );
              if (focusableElements && focusableElements.length > 0) {
                const firstElement = focusableElements[0] as HTMLElement;
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                if (e.shiftKey && document.activeElement === firstElement) {
                  e.preventDefault();
                  lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                  e.preventDefault();
                  firstElement.focus();
                }
              }
            }
          }}
        >
          <Card
            className="max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle id="artifact-modal-title">{selectedArtifact.title}</CardTitle>
                <Badge
                  variant={
                    selectedArtifact.status === 'verified'
                      ? 'default'
                      : selectedArtifact.status === 'submitted'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {selectedArtifact.status}
                </Badge>
              </div>
              <CardDescription>
                {toDate(selectedArtifact.createdAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Competency Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedArtifact.competencyTags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedArtifact.activityResults && (
                <div>
                  <h4 className="font-semibold mb-2">Activity Results</h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Score</div>
                        <div className="text-xl font-bold">
                          {selectedArtifact.activityResults.score.toFixed(0)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Time Spent</div>
                        <div className="text-xl font-bold">
                          {Math.round(selectedArtifact.activityResults.timeSpent / 60)}m
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedArtifact.reflectionResponse && (
                <div>
                  <h4 className="font-semibold mb-2">Reflection</h4>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    {selectedArtifact.reflectionResponse}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setSelectedArtifact(null)}>Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default PortfolioViewer;
