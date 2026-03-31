'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/branded/status-badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ClipboardList,
  TrendingUp,
  Eye,
  Trash2,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  Target,
  Mail,
} from 'lucide-react';
import { VoiceLoading, VoiceEmptyState } from '@/components/voice';
import { useToast } from '@/hooks/use-toast';
import {
  getQuizSessions,
  updateSessionStatus,
  markSessionAsRead,
  deleteSession,
  exportQuizSessionsToCSV,
} from './actions';
import {
  branchLabels,
  categoryLabels,
  statusLabels,
  type QuizSession,
} from './constants';
import { formatDistanceToNow } from 'date-fns';

// Status colors resolved by StatusBadge semantic map

function getScoreColor(score: number, maxScore: number): string {
  const ratio = score / maxScore;
  if (ratio >= 0.5) return 'text-green-400';
  if (ratio >= 0.25) return 'text-amber-400';
  return 'text-slate-dim';
}

function ScoreBar({ label, score, maxScore }: { label: string; score: number; maxScore: number }) {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-dim">{label}</span>
        <span className={getScoreColor(score, maxScore)}>{score}</span>
      </div>
      <div className="h-1.5 bg-nex-dark rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan to-cyan-glow transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function QuizSessionsClient() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<QuizSession | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await exportQuizSessionsToCSV(
        statusFilter as QuizSession['status'] | 'all'
      );

      if (result.success && result.csv && result.filename) {
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: `Exported ${result.filename}`, variant: 'success' });
      } else {
        toast({ title: result.error || 'Failed to export CSV', variant: 'destructive' });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const loadSessions = async () => {
    setLoading(true);
    const result = await getQuizSessions();
    if (result.success && result.sessions) {
      setSessions(result.sessions);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, status: QuizSession['status']) => {
    await updateSessionStatus(id, status);
    await loadSessions();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      await deleteSession(id);
      await loadSessions();
    }
  };

  const openSessionDetails = async (session: QuizSession) => {
    setSelectedSession(session);
    if (!session.read) {
      await markSessionAsRead(session.id);
      await loadSessions();
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    if (statusFilter === 'all') return true;
    return s.status === statusFilter;
  });

  // Stats
  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  const incompleteCount = sessions.filter((s) => s.status === 'incomplete').length;
  const withEmailCount = sessions.filter((s) => s.email).length;

  if (loading) {
    return <VoiceLoading context="admin" variant="spinner" message="Loading quiz sessions..." />;
  }

  // Calculate max score for scaling
  const maxScore = Math.max(
    ...sessions.flatMap(s => [
      s.scores.strategic,
      s.scores.innovation,
      s.scores.tactical,
      s.scores.talent,
      s.scores.technology,
    ]),
    10 // Minimum scale
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Total Sessions</CardTitle>
            <ClipboardList className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{sessions.length}</div>
            <p className="text-xs text-slate-dim">{withEmailCount} with email</p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{completedCount}</div>
            <p className="text-xs text-slate-dim">
              {sessions.length > 0
                ? `${Math.round((completedCount / sessions.length) * 100)}% completion`
                : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">Incomplete</CardTitle>
            <Clock className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{incompleteCount}</div>
            <p className="text-xs text-slate-dim">dropped off</p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-light">With Emails</CardTitle>
            <Mail className="h-4 w-4 text-slate-dim" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{withEmailCount}</div>
            <p className="text-xs text-slate-dim">captured leads</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="bg-nex-surface border-nex-light">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-white">Service Discovery Sessions</CardTitle>
              <CardDescription className="text-slate-dim">
                Quiz completions with recommendations and contact info
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-nex-dark border-nex-border text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-nex-surface border-nex-border">
                  <SelectItem value="all" className="text-white">All Status</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="text-white">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={isExporting}
                className="border-nex-border text-slate-light hover:text-cyan"
              >
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <VoiceEmptyState
              context="admin-leads"
              title="No quiz sessions found"
              description="Completed service discovery quizzes will appear here"
              variant="inline"
              size="md"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Service discovery quiz sessions">
                <TableHeader>
                  <TableRow className="border-nex-border hover:bg-transparent">
                    <TableHead className="text-slate-dim">Status</TableHead>
                    <TableHead className="text-slate-dim">Contact</TableHead>
                    <TableHead className="text-slate-dim">Branch</TableHead>
                    <TableHead className="text-slate-dim">Primary Match</TableHead>
                    <TableHead className="text-slate-dim">Top Score</TableHead>
                    <TableHead className="text-slate-dim">Completed</TableHead>
                    <TableHead className="text-right text-slate-dim">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => {
                    // Find top score
                    const topScore = Math.max(
                      session.scores.strategic,
                      session.scores.innovation,
                      session.scores.tactical,
                      session.scores.talent,
                      session.scores.technology
                    );
                    const topCategory = Object.entries(session.scores).find(
                      ([, score]) => score === topScore
                    )?.[0];

                    return (
                      <TableRow
                        key={session.id}
                        className={`border-nex-border hover:bg-nex-light/50 cursor-pointer ${
                          !session.read ? 'bg-cyan/5' : ''
                        }`}
                        onClick={() => openSessionDetails(session)}
                      >
                        <TableCell>
                          <StatusBadge
                            status={session.status}
                            label={statusLabels[session.status]}
                          />
                        </TableCell>
                        <TableCell>
                          {session.email ? (
                            <div>
                              {session.firstName && (
                                <div className="font-medium text-white">
                                  {session.firstName} {session.lastName}
                                </div>
                              )}
                              <div className="text-xs text-slate-dim">{session.email}</div>
                              {session.companyName && (
                                <div className="text-xs text-slate-dim">{session.companyName}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-dim text-xs">No email captured</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {session.branch ? (
                            <Badge variant="outline" className="border-nex-border text-slate-light">
                              {branchLabels[session.branch]}
                            </Badge>
                          ) : (
                            <span className="text-slate-dim">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {session.primaryRecommendation ? (
                            <Badge variant="outline" className="border-cyan/30 text-cyan">
                              {categoryLabels[session.primaryRecommendation] ||
                                session.primaryRecommendation}
                            </Badge>
                          ) : (
                            <span className="text-slate-dim">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 text-cyan" />
                            <span className="text-slate-light">{topScore}</span>
                            {topCategory && (
                              <span className="text-xs text-slate-dim">
                                ({categoryLabels[topCategory]})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-dim">
                          {session.completedAt
                            ? formatDistanceToNow(session.completedAt, { addSuffix: true })
                            : 'Not completed'}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openSessionDetails(session)}
                              className="text-slate-dim hover:text-cyan"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(session.id)}
                              className="text-slate-dim hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent className="bg-nex-surface border-nex-light max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-cyan" />
                  Quiz Session Details
                </DialogTitle>
                <DialogDescription className="text-slate-dim">
                  {selectedSession.email || 'Anonymous session'} |{' '}
                  {selectedSession.completedAt
                    ? `Completed ${formatDistanceToNow(selectedSession.completedAt, {
                        addSuffix: true,
                      })}`
                    : 'Not completed'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Status Update */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-light">Status:</span>
                  <Select
                    value={selectedSession.status}
                    onValueChange={(value) =>
                      handleStatusChange(selectedSession.id, value as QuizSession['status'])
                    }
                  >
                    <SelectTrigger className="w-[150px] bg-nex-dark border-nex-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-nex-surface border-nex-border">
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="text-white">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Contact Info */}
                {selectedSession.email && (
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-nex-dark">
                    <div>
                      <p className="text-xs text-slate-dim">Email</p>
                      <a
                        href={`mailto:${selectedSession.email}`}
                        className="text-cyan hover:underline"
                      >
                        {selectedSession.email}
                      </a>
                    </div>
                    <div>
                      <p className="text-xs text-slate-dim">Name</p>
                      <p className="text-slate-light">
                        {selectedSession.firstName || selectedSession.lastName
                          ? `${selectedSession.firstName || ''} ${selectedSession.lastName || ''}`
                          : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-dim">Company</p>
                      <p className="text-slate-light">
                        {selectedSession.companyName || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-dim">Source</p>
                      <p className="text-slate-light">{selectedSession.source || 'Direct'}</p>
                    </div>
                  </div>
                )}

                {/* Quiz Results */}
                <div className="p-4 rounded-lg bg-nex-dark space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-cyan" />
                    <span className="text-sm font-medium text-slate-light">Score Breakdown</span>
                  </div>
                  <div className="grid gap-3">
                    <ScoreBar
                      label="Strategic"
                      score={selectedSession.scores.strategic}
                      maxScore={maxScore}
                    />
                    <ScoreBar
                      label="Innovation"
                      score={selectedSession.scores.innovation}
                      maxScore={maxScore}
                    />
                    <ScoreBar
                      label="Tactical"
                      score={selectedSession.scores.tactical}
                      maxScore={maxScore}
                    />
                    <ScoreBar
                      label="Capability-Elevating"
                      score={selectedSession.scores.talent}
                      maxScore={maxScore}
                    />
                    <ScoreBar
                      label="Technology"
                      score={selectedSession.scores.technology}
                      maxScore={maxScore}
                    />
                  </div>
                </div>

                {/* Recommendations */}
                {selectedSession.primaryRecommendation && (
                  <div className="p-4 rounded-lg bg-nex-dark">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-cyan" />
                      <span className="text-sm font-medium text-slate-light">Recommendations</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-slate-dim">Primary:</span>
                        <Badge variant="outline" className="ml-2 border-cyan/30 text-cyan">
                          {categoryLabels[selectedSession.primaryRecommendation] ||
                            selectedSession.primaryRecommendation}
                        </Badge>
                      </div>
                      {selectedSession.secondaryRecommendations.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-slate-dim">Secondary:</span>
                          {selectedSession.secondaryRecommendations.map((rec) => (
                            <Badge
                              key={rec}
                              variant="outline"
                              className="border-nex-border text-slate-light"
                            >
                              {categoryLabels[rec] || rec}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedSession.tags.length > 0 && (
                  <div className="p-4 rounded-lg bg-nex-dark">
                    <div className="text-xs text-slate-dim mb-2">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedSession.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs border-nex-border text-slate-dim"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* UTM Data */}
                {(selectedSession.utmCampaign ||
                  selectedSession.utmSource ||
                  selectedSession.utmMedium) && (
                  <div className="p-4 rounded-lg bg-nex-dark">
                    <div className="text-xs text-slate-dim mb-2">Campaign Data</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {selectedSession.utmCampaign && (
                        <div>
                          <span className="text-slate-dim">Campaign: </span>
                          <span className="text-slate-light">{selectedSession.utmCampaign}</span>
                        </div>
                      )}
                      {selectedSession.utmSource && (
                        <div>
                          <span className="text-slate-dim">Source: </span>
                          <span className="text-slate-light">{selectedSession.utmSource}</span>
                        </div>
                      )}
                      {selectedSession.utmMedium && (
                        <div>
                          <span className="text-slate-dim">Medium: </span>
                          <span className="text-slate-light">{selectedSession.utmMedium}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedSession(null)}
                  className="border-nex-border text-slate-light"
                >
                  Close
                </Button>
                {selectedSession.email && (
                  <a href={`mailto:${selectedSession.email}`}>
                    <Button className="bg-cyan text-nex-deep hover:bg-cyan-glow">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Lead
                    </Button>
                  </a>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
