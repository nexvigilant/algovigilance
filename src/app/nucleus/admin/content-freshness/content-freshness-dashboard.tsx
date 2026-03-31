'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  FileText,
  Lightbulb,
  AlertOctagon,
  Mic,
  Radio,
  Wand2,
  GitBranch,
  Loader2,
  PenLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import type { ContentType } from '@/types/intelligence';

import { logger } from '@/lib/logger';
const log = logger.scope('content-freshness/content-freshness-dashboard');

interface FreshnessEntry {
  slug: string;
  title: string;
  contentType: ContentType;
  publishedAt: string;
  daysSincePublished: number;
  lastValidatedAt: string | null;
  daysSinceValidation: number | null;
  healthScore: number | null;
  hasIssues: boolean;
  openIssuesCount: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  priorityScore: number;
}

interface FreshnessReport {
  success: boolean;
  generatedAt: string;
  summary: {
    totalContent: number;
    neverValidated: number;
    staleContent: number;
    criticalPriority: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    averageAge: number;
    contentWithIssues: number;
  };
  byPriority: {
    critical: FreshnessEntry[];
    high: FreshnessEntry[];
    medium: FreshnessEntry[];
    low: FreshnessEntry[];
  };
  byContentType: Record<ContentType, FreshnessEntry[]>;
  all: FreshnessEntry[];
}

const CONTENT_TYPE_ICONS: Record<ContentType, React.ReactNode> = {
  podcast: <Mic className="h-4 w-4" />,
  publication: <FileText className="h-4 w-4" />,
  perspective: <Lightbulb className="h-4 w-4" />,
  'field-note': <FileText className="h-4 w-4" />,
  signal: <Radio className="h-4 w-4" />,
};

const PRIORITY_CONFIG = {
  critical: {
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Critical',
  },
  high: {
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    label: 'High',
  },
  medium: {
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    label: 'Medium',
  },
  low: {
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'Low',
  },
};

export function ContentFreshnessDashboard() {
  const { user } = useAuth();
  const [report, setReport] = useState<FreshnessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Correction dialog state
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FreshnessEntry | null>(null);
  const [correctionText, setCorrectionText] = useState('');
  const [correctionMode, setCorrectionMode] = useState<'ai' | 'append'>('ai');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionResult, setCorrectionResult] = useState<{
    success: boolean;
    prUrl?: string;
    method?: string;
    summary?: string;
  } | null>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  // Open correction dialog
  function handleOpenCorrection(entry: FreshnessEntry) {
    setSelectedEntry(entry);
    setCorrectionText('');
    setCorrectionMode('ai');
    setCorrectionResult(null);
    setCorrectionDialogOpen(true);
  }

  // Submit correction
  async function handleSubmitCorrection() {
    if (!selectedEntry || !correctionText.trim()) return;

    setSubmittingCorrection(true);
    try {
      const response = await fetch('/api/admin/content-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: selectedEntry.slug,
          correction: correctionText,
          issueTitle: 'Manual correction from Content Freshness',
          userId: user?.uid,
          mode: correctionMode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create correction');
      }

      const result = await response.json();
      setCorrectionResult({
        success: true,
        prUrl: result.prUrl,
        method: result.correctionMethod,
        summary: result.correctionSummary,
      });
    } catch (err) {
      log.error('Error creating correction:', err);
      setCorrectionResult({
        success: false,
      });
    } finally {
      setSubmittingCorrection(false);
    }
  }

  async function fetchReport() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/content-freshness');
      if (!response.ok) {
        throw new Error('Failed to fetch freshness report');
      }
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <Card className="bg-nex-surface border-nex-light">
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p className="text-white text-lg">Failed to load freshness report</p>
          <p className="text-slate-dim mt-2">{error}</p>
          <Button onClick={fetchReport} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { summary, byPriority } = report;

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-dim">Total Content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{summary.totalContent}</div>
            <p className="text-sm text-slate-dim">
              Avg age: {summary.averageAge} days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-dim">Never Validated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${summary.neverValidated > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {summary.neverValidated}
            </div>
            <p className="text-sm text-slate-dim">
              {summary.staleContent} stale (&gt;30 days)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-dim">Priority Breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 text-sm">
              <Badge className={`${PRIORITY_CONFIG.critical.bgColor} ${PRIORITY_CONFIG.critical.color} border-0`}>
                {summary.criticalPriority}
              </Badge>
              <Badge className={`${PRIORITY_CONFIG.high.bgColor} ${PRIORITY_CONFIG.high.color} border-0`}>
                {summary.highPriority}
              </Badge>
              <Badge className={`${PRIORITY_CONFIG.medium.bgColor} ${PRIORITY_CONFIG.medium.color} border-0`}>
                {summary.mediumPriority}
              </Badge>
              <Badge className={`${PRIORITY_CONFIG.low.bgColor} ${PRIORITY_CONFIG.low.color} border-0`}>
                {summary.lowPriority}
              </Badge>
            </div>
            <p className="text-sm text-slate-dim mt-2">
              {summary.contentWithIssues} with open issues
            </p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-dim">Quick Actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link href="/nucleus/admin/content-validation">
                <Button size="sm" variant="outline" className="w-full bg-nex-background border-nex-light">
                  Run Validation
                </Button>
              </Link>
              <Button size="sm" onClick={fetchReport} variant="outline" className="w-full bg-nex-background border-nex-light">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Tabs */}
      <Tabs defaultValue="critical" className="w-full">
        <TabsList className="bg-nex-surface border-nex-light">
          <TabsTrigger value="critical" className="data-[state=active]:bg-red-500/20">
            <AlertOctagon className="h-4 w-4 mr-2 text-red-500" />
            Critical ({summary.criticalPriority})
          </TabsTrigger>
          <TabsTrigger value="high" className="data-[state=active]:bg-orange-500/20">
            <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
            High ({summary.highPriority})
          </TabsTrigger>
          <TabsTrigger value="medium" className="data-[state=active]:bg-amber-500/20">
            <Clock className="h-4 w-4 mr-2 text-amber-500" />
            Medium ({summary.mediumPriority})
          </TabsTrigger>
          <TabsTrigger value="low" className="data-[state=active]:bg-green-500/20">
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            Low ({summary.lowPriority})
          </TabsTrigger>
        </TabsList>

        {(['critical', 'high', 'medium', 'low'] as const).map((priority) => (
          <TabsContent key={priority} value={priority} className="mt-4">
            {byPriority[priority].length === 0 ? (
              <Card className="bg-nex-surface border-nex-light">
                <CardContent className="py-8 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-slate-dim">No {priority} priority content</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {byPriority[priority].map((entry) => (
                  <FreshnessCard
                    key={entry.slug}
                    entry={entry}
                    onCorrect={() => handleOpenCorrection(entry)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Correction Dialog */}
      <Dialog open={correctionDialogOpen} onOpenChange={setCorrectionDialogOpen}>
        <DialogContent className="bg-nex-surface border-nex-light max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <PenLine className="h-5 w-5 text-cyan" />
              Apply Content Correction
            </DialogTitle>
            <DialogDescription className="text-slate-dim">
              {selectedEntry?.title && (
                <>Correcting: <span className="text-white">{selectedEntry.title}</span></>
              )}
            </DialogDescription>
          </DialogHeader>

          {correctionResult ? (
            <div className="py-6">
              {correctionResult.success ? (
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    Correction PR Created!
                  </h3>
                  <p className="text-slate-dim mb-4">
                    Method: <Badge variant="outline" className="ml-1 text-cyan border-cyan/30">
                      {correctionResult.method === 'ai_merge' ? 'AI Merge' : 'Append'}
                    </Badge>
                  </p>
                  {correctionResult.summary && (
                    <p className="text-sm text-slate-light mb-4">{correctionResult.summary}</p>
                  )}
                  <a
                    href={correctionResult.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-cyan hover:underline"
                  >
                    <GitBranch className="h-4 w-4" />
                    View Draft PR
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    Failed to Create Correction
                  </h3>
                  <p className="text-slate-dim">Please try again or check the console for details.</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="correction-mode" className="text-slate-light">
                    Correction Mode
                  </Label>
                  <Select value={correctionMode} onValueChange={(v) => setCorrectionMode(v as 'ai' | 'append')}>
                    <SelectTrigger className="bg-nex-background border-nex-light text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-nex-surface border-nex-light">
                      <SelectItem value="ai" className="text-white">
                        <div className="flex items-center gap-2">
                          <Wand2 className="h-4 w-4 text-cyan" />
                          AI Merge (Intelligent)
                        </div>
                      </SelectItem>
                      <SelectItem value="append" className="text-white">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-amber-500" />
                          Append (Simple)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-dim">
                    {correctionMode === 'ai'
                      ? 'AI will analyze and merge the correction intelligently into the article'
                      : 'The correction will be appended as an update section at the end'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="correction-text" className="text-slate-light">
                    Correction Details
                  </Label>
                  <Textarea
                    id="correction-text"
                    value={correctionText}
                    onChange={(e) => setCorrectionText(e.target.value)}
                    placeholder="Describe the correction needed. For AI merge, be specific about what needs to change..."
                    className="bg-nex-background border-nex-light text-white min-h-[120px]"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCorrectionDialogOpen(false)}
                  className="bg-nex-background border-nex-light text-slate-light"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitCorrection}
                  disabled={!correctionText.trim() || submittingCorrection}
                  className="bg-cyan hover:bg-cyan/90 text-nex-background"
                >
                  {submittingCorrection ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating PR...
                    </>
                  ) : (
                    <>
                      <GitBranch className="h-4 w-4 mr-2" />
                      Create Correction PR
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FreshnessCard({ entry, onCorrect }: { entry: FreshnessEntry; onCorrect: () => void }) {
  const priorityConfig = PRIORITY_CONFIG[entry.priority];

  return (
    <Card className={`bg-nex-surface border-nex-light border-l-4 ${priorityConfig.borderColor}`}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {CONTENT_TYPE_ICONS[entry.contentType]}
              <Badge variant="outline" className="text-xs capitalize">
                {entry.contentType.replace('-', ' ')}
              </Badge>
              <Badge className={`${priorityConfig.bgColor} ${priorityConfig.color} border-0 text-xs`}>
                Score: {entry.priorityScore}
              </Badge>
            </div>

            <h3 className="text-white font-medium">{entry.title}</h3>
            <p className="text-sm text-slate-dim">{entry.slug}</p>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1 text-slate-dim">
                <Calendar className="h-4 w-4" />
                Published {entry.daysSincePublished} days ago
              </span>

              {entry.daysSinceValidation !== null ? (
                <span className={`flex items-center gap-1 ${entry.daysSinceValidation > 30 ? 'text-amber-500' : 'text-slate-dim'}`}>
                  <Clock className="h-4 w-4" />
                  Validated {entry.daysSinceValidation} days ago
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  Never validated
                </span>
              )}

              {entry.healthScore !== null && (
                <span
                  className={`flex items-center gap-1 ${
                    entry.healthScore >= 80
                      ? 'text-green-500'
                      : entry.healthScore >= 60
                        ? 'text-amber-500'
                        : 'text-red-500'
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Health: {entry.healthScore}%
                </span>
              )}

              {entry.openIssuesCount > 0 && (
                <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                  {entry.openIssuesCount} open issues
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link href={`/intelligence/${entry.slug}`}>
              <Button size="sm" variant="outline" className="bg-nex-background border-nex-light">
                <ExternalLink className="h-4 w-4 mr-2" />
                View
              </Button>
            </Link>
            <Link href={`/nucleus/admin/content-validation?slug=${entry.slug}`}>
              <Button size="sm" variant="outline" className="bg-cyan/20 border-cyan/30 text-cyan">
                Validate
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={onCorrect}
              className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30"
            >
              <PenLine className="h-4 w-4 mr-2" />
              Quick Fix
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
