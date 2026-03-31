'use client';


import { logger } from '@/lib/logger';
const log = logger.scope('content-pipeline/pipeline-client');
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/branded/status-badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { VoiceEmptyState } from '@/components/voice';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Zap,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Sparkles,
  Target,
  ChevronRight,
  Loader2,
  Pencil,
} from 'lucide-react';
import Link from 'next/link';
import {
  getDomainsWithStats,
  getDomainKSBs,
  createBatch,
  createBatchForMissingContent,
  createBatchForLowQuality,
  startBatchProcessing,
  cancelBatchProcessing,
  fetchBatches,
  fetchBatchProgress,
  fetchOrchestrationStats,
  type DomainWithStats,
  type BatchListItem,
} from './actions';
import type { CapabilityComponent } from '@/types/pv-curriculum';
import type { BatchProgress, OrchestrationStats } from '@/lib/content-orchestrator';
import { PipelineAnalytics } from './pipeline-analytics';
import { PipelineScheduling } from './pipeline-scheduling';

type ActivityEngine = 'red_pen' | 'triage' | 'synthesis';

export function ContentPipelineClient() {
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [domains, setDomains] = useState<DomainWithStats[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [domainKsbs, setDomainKsbs] = useState<CapabilityComponent[]>([]);
  const [selectedKsbs, setSelectedKsbs] = useState<Set<string>>(new Set());
  const [batches, setBatches] = useState<BatchListItem[]>([]);
  const [stats, setStats] = useState<OrchestrationStats | null>(null);
  const [activeBatchProgress, setActiveBatchProgress] = useState<BatchProgress | null>(null);

  // UI State
  const [loading, setLoading] = useState(true);
  const [loadingKsbs, setLoadingKsbs] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activityEngine, setActivityEngine] = useState<ActivityEngine>('synthesis');
  const [bypassQualityGates, setBypassQualityGates] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({ open: false, title: '', description: '', action: async () => {} });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Poll for batch progress
  useEffect(() => {
    const activeBatch = batches.find(b => b.status === 'processing');
    if (!activeBatch) {
      setActiveBatchProgress(null);
      return;
    }

    const pollProgress = async () => {
      const result = await fetchBatchProgress(activeBatch.id);
      if (result.success && result.progress) {
        setActiveBatchProgress(result.progress);
      }
    };

    pollProgress();
    const interval = setInterval(pollProgress, 3000);
    return () => clearInterval(interval);
  }, [batches]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [domainsResult, batchesResult, statsResult] = await Promise.all([
        getDomainsWithStats(),
        fetchBatches({ limit: 10 }),
        fetchOrchestrationStats(),
      ]);

      if (domainsResult.success && domainsResult.domains) {
        setDomains(domainsResult.domains);
      }
      if (batchesResult.success && batchesResult.batches) {
        setBatches(batchesResult.batches);
      }
      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      log.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDomainKsbs = async (domainId: string) => {
    setLoadingKsbs(true);
    setSelectedKsbs(new Set());
    try {
      const result = await getDomainKSBs(domainId);
      if (result.success && result.ksbs) {
        setDomainKsbs(result.ksbs);
      }
    } catch (error) {
      log.error('Error loading KSBs:', error);
    } finally {
      setLoadingKsbs(false);
    }
  };

  const handleDomainChange = (domainId: string) => {
    setSelectedDomain(domainId);
    if (domainId) {
      loadDomainKsbs(domainId);
    } else {
      setDomainKsbs([]);
    }
  };

  const handleSelectAll = () => {
    if (selectedKsbs.size === domainKsbs.length) {
      setSelectedKsbs(new Set());
    } else {
      setSelectedKsbs(new Set(domainKsbs.map(k => k.id)));
    }
  };

  const handleSelectMissing = () => {
    const missing = domainKsbs.filter(k => !k.hook || !k.concept || !k.activity || !k.reflection);
    setSelectedKsbs(new Set(missing.map(k => k.id)));
  };

  const handleToggleKsb = (ksbId: string) => {
    const newSelected = new Set(selectedKsbs);
    if (newSelected.has(ksbId)) {
      newSelected.delete(ksbId);
    } else {
      newSelected.add(ksbId);
    }
    setSelectedKsbs(newSelected);
  };

  const handleCreateBatch = async () => {
    if (selectedKsbs.size === 0 || !selectedDomain) return;

    setProcessing(true);
    try {
      const result = await createBatch(
        selectedDomain,
        Array.from(selectedKsbs),
        activityEngine,
        {
          name: batchName || undefined,
          bypassQualityGates,
        }
      );

      if (result.success && result.batchId) {
        // Start processing immediately
        await startBatchProcessing(result.batchId);
        // Refresh batches
        const batchesResult = await fetchBatches({ limit: 10 });
        if (batchesResult.success && batchesResult.batches) {
          setBatches(batchesResult.batches);
        }
        // Clear selection
        setSelectedKsbs(new Set());
        setBatchName('');
        setActiveTab('batches');
      }
    } catch (error) {
      log.error('Error creating batch:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleQuickFillMissing = async () => {
    if (!selectedDomain) return;

    setConfirmDialog({
      open: true,
      title: 'Generate Missing Content',
      description: `This will create AI content for all KSBs in the selected domain that are missing content. Continue?`,
      action: async () => {
        setProcessing(true);
        try {
          const result = await createBatchForMissingContent(
            selectedDomain,
            activityEngine,
            { bypassQualityGates }
          );

          if (result.success && result.batchId) {
            await startBatchProcessing(result.batchId);
            const batchesResult = await fetchBatches({ limit: 10 });
            if (batchesResult.success && batchesResult.batches) {
              setBatches(batchesResult.batches);
            }
            setActiveTab('batches');
          }
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  const handleRegenerateLowQuality = async () => {
    if (!selectedDomain) return;

    setConfirmDialog({
      open: true,
      title: 'Regenerate Low Quality Content',
      description: `This will regenerate content for all KSBs below 70% quality score. Continue?`,
      action: async () => {
        setProcessing(true);
        try {
          const result = await createBatchForLowQuality(
            selectedDomain,
            activityEngine,
            70,
            { bypassQualityGates: true }
          );

          if (result.success && result.batchId) {
            await startBatchProcessing(result.batchId);
            const batchesResult = await fetchBatches({ limit: 10 });
            if (batchesResult.success && batchesResult.batches) {
              setBatches(batchesResult.batches);
            }
            setActiveTab('batches');
          }
        } finally {
          setProcessing(false);
        }
      },
    });
  };

  const handleCancelBatch = async (batchId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Cancel Batch',
      description: 'This will cancel all remaining jobs in this batch. Already completed jobs will not be affected.',
      action: async () => {
        await cancelBatchProcessing(batchId);
        const batchesResult = await fetchBatches({ limit: 10 });
        if (batchesResult.success && batchesResult.batches) {
          setBatches(batchesResult.batches);
        }
      },
    });
  };

  const getStatusBadge = (status: string) => {
    return <StatusBadge status={status} />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-nex-surface border-nex-border">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-nex-surface border-nex-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-cyan" />
              <div>
                <div className="text-2xl font-bold text-foreground">{stats?.activeBatches || 0}</div>
                <div className="text-sm text-muted-foreground">Active Batches</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-foreground">{stats?.queueDepth || 0}</div>
                <div className="text-sm text-muted-foreground">Jobs Queued</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-foreground">{stats?.completedToday || 0}</div>
                <div className="text-sm text-muted-foreground">Completed Today</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-foreground">{stats?.failedToday || 0}</div>
                <div className="text-sm text-muted-foreground">Failed Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Batch Progress */}
      {activeBatchProgress && (
        <Card className="bg-gradient-to-r from-cyan/10 to-transparent border-cyan/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Loader2 className="h-5 w-5 animate-spin text-cyan" />
                Processing Batch
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancelBatch(activeBatchProgress.batchId)}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <Pause className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {activeBatchProgress.completed} of {activeBatchProgress.total} jobs complete
                </span>
                <span className="text-cyan">{activeBatchProgress.percentComplete}%</span>
              </div>
              <Progress value={activeBatchProgress.percentComplete} className="h-2" />
              {activeBatchProgress.currentJob && (
                <div className="text-sm text-muted-foreground">
                  Currently processing: <span className="text-foreground">{activeBatchProgress.currentJob.ksbTitle}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-nex-dark border border-nex-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="generate">Generate Content</TabsTrigger>
          <TabsTrigger value="batches">Batch History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-nex-surface border-nex-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-gold" />
                Domain Content Coverage
              </CardTitle>
              <CardDescription>
                Content generation status across all domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              {domains.length === 0 ? (
                <VoiceEmptyState
                  icon="Database"
                  title="No domains found"
                  description="Create domains in the PV Framework to get started"
                  variant="inline"
                />
              ) : (
                <div className="space-y-3">
                  {domains.map(domain => {
                    const coverage = domain.ksbCount > 0
                      ? Math.round((domain.withContent / domain.ksbCount) * 100)
                      : 0;
                    return (
                      <div
                        key={domain.id}
                        className="p-4 bg-nex-dark rounded-lg border border-nex-border hover:border-cyan/30 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedDomain(domain.id);
                          loadDomainKsbs(domain.id);
                          setActiveTab('generate');
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-foreground">{domain.name}</div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {domain.ksbCount} KSBs
                          </span>
                          <span className="text-green-400">
                            {domain.withContent} complete
                          </span>
                          <span className="text-yellow-400">
                            {domain.missingContent} missing
                          </span>
                          <span className="text-cyan">
                            {domain.published} published
                          </span>
                        </div>
                        <div className="mt-2">
                          <Progress value={coverage} className="h-1.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate Content Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card className="bg-nex-surface border-nex-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan" />
                Generate Content
              </CardTitle>
              <CardDescription>
                Select KSBs to generate AI content for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Domain Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Select value={selectedDomain} onValueChange={handleDomainChange}>
                    <SelectTrigger className="bg-nex-dark border-nex-border">
                      <SelectValue placeholder="Select a domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map(domain => (
                        <SelectItem key={domain.id} value={domain.id}>
                          {domain.name} ({domain.missingContent} missing)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Activity Engine</Label>
                  <Select value={activityEngine} onValueChange={(v) => setActivityEngine(v as ActivityEngine)}>
                    <SelectTrigger className="bg-nex-dark border-nex-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="synthesis">Synthesis (Creative)</SelectItem>
                      <SelectItem value="red_pen">Red Pen (Error Detection)</SelectItem>
                      <SelectItem value="triage">Triage (Decision Making)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Batch Name (Optional)</Label>
                  <Input
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className="bg-nex-dark border-nex-border"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="bypassQuality"
                    checked={bypassQualityGates}
                    onCheckedChange={(checked) => setBypassQualityGates(checked === true)}
                  />
                  <Label htmlFor="bypassQuality" className="text-sm text-muted-foreground cursor-pointer">
                    Bypass quality gates (generate even without research data)
                  </Label>
                </div>
              </div>

              {/* Quick Actions */}
              {selectedDomain && (
                <div className="flex gap-2 pt-2 border-t border-nex-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleQuickFillMissing}
                    disabled={processing}
                    className="border-cyan/50 text-cyan hover:bg-cyan/10"
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Fill All Missing
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateLowQuality}
                    disabled={processing}
                    className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regenerate Low Quality
                  </Button>
                </div>
              )}

              {/* KSB Selection */}
              {selectedDomain && (
                <div className="mt-4 pt-4 border-t border-nex-border">
                  <div className="flex items-center justify-between mb-3">
                    <Label>Select KSBs ({selectedKsbs.size} selected)</Label>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                        {selectedKsbs.size === domainKsbs.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleSelectMissing}>
                        Select Missing Only
                      </Button>
                    </div>
                  </div>

                  {loadingKsbs ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                      {domainKsbs.map(ksb => {
                        const hasContent = ksb.hook && ksb.concept && ksb.activity && ksb.reflection;
                        return (
                          <div
                            key={ksb.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                              selectedKsbs.has(ksb.id)
                                ? 'bg-cyan/10 border-cyan/50'
                                : 'bg-nex-dark border-nex-border hover:border-cyan/30'
                            }`}
                            onClick={() => handleToggleKsb(ksb.id)}
                          >
                            <Checkbox
                              checked={selectedKsbs.has(ksb.id)}
                              onCheckedChange={() => handleToggleKsb(ksb.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-foreground truncate">
                                {ksb.itemName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {ksb.id} &bull; {ksb.type}
                              </div>
                            </div>
                            {hasContent ? (
                              <Badge className="bg-green-500/20 text-green-400 text-xs">Complete</Badge>
                            ) : (
                              <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Missing</Badge>
                            )}
                            <Link
                              href={`/nucleus/admin/academy/ksb-builder?domain=${selectedDomain}&ksb=${ksb.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded hover:bg-cyan/20 text-muted-foreground hover:text-cyan transition-colors"
                              title="Edit in Builder"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Generate Button */}
              {selectedKsbs.size > 0 && (
                <div className="flex justify-end pt-4 border-t border-nex-border">
                  <Button
                    onClick={handleCreateBatch}
                    disabled={processing}
                    className="bg-cyan text-nex-deep hover:bg-cyan-glow"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Batch...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Generate {selectedKsbs.size} KSBs
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch History Tab */}
        <TabsContent value="batches" className="space-y-4">
          <Card className="bg-nex-surface border-nex-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gold" />
                    Batch History
                  </CardTitle>
                  <CardDescription>
                    Recent content generation batches
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadInitialData}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {batches.length === 0 ? (
                <VoiceEmptyState
                  icon="Clock"
                  title="No batches yet"
                  description="Create a batch to start generating content"
                  variant="inline"
                />
              ) : (
                <div className="space-y-3">
                  {batches.map(batch => (
                    <div
                      key={batch.id}
                      className="p-4 bg-nex-dark rounded-lg border border-nex-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-foreground">{batch.name}</div>
                        {getStatusBadge(batch.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span>{batch.domainName}</span>
                        <span>{batch.totalJobs} jobs</span>
                        <span className="text-green-400">{batch.completedJobs} completed</span>
                        {batch.failedJobs > 0 && (
                          <span className="text-red-400">{batch.failedJobs} failed</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <Progress value={batch.progress} className="flex-1 h-1.5" />
                        <span className="text-sm text-cyan">{batch.progress}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Created {new Date(batch.createdAt).toLocaleString()}
                      </div>
                      {batch.status === 'processing' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelBatch(batch.id)}
                          className="mt-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <PipelineAnalytics />
        </TabsContent>

        {/* Scheduling Tab */}
        <TabsContent value="scheduling" className="space-y-4">
          <PipelineScheduling />
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="bg-nex-surface border-nex-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-nex-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await confirmDialog.action();
                setConfirmDialog(prev => ({ ...prev, open: false }));
              }}
              className="bg-cyan text-nex-deep hover:bg-cyan-glow"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
