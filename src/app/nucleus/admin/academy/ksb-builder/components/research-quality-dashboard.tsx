'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  FileText,
  Shield,
} from 'lucide-react';
import { getKSBsForDomain, validateQualityGates } from '@/lib/actions/ksb-builder';
import { PRODUCTION_THRESHOLDS } from '../constants';
import type { CapabilityComponent } from '@/types/pv-curriculum';

import { logger } from '@/lib/logger';
const log = logger.scope('components/research-quality-dashboard');

interface DomainStats {
  domainId: string;
  domainName: string;
  total: number;
  withResearch: number;
  productionReady: number;
  avgCoverage: number;
  avgQuality: number;
  blockers: { type: string; count: number }[];
}

interface ResearchQualityDashboardProps {
  onSelectKSB?: (ksb: CapabilityComponent) => void;
}

export function ResearchQualityDashboard({
  onSelectKSB,
}: ResearchQualityDashboardProps) {
  log.debug('ResearchQualityDashboard rendering');
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [stats, setStats] = useState<DomainStats[]>([]);
  const [ksbsNeedingWork, setKsbsNeedingWork] = useState<CapabilityComponent[]>(
    []
  );
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const domains = [
    { id: 'D01', name: 'Safety Case Management' },
    { id: 'D02', name: 'Signal Detection' },
    { id: 'D03', name: 'Risk Management' },
    { id: 'D04', name: 'Regulatory Reporting' },
    { id: 'D05', name: 'Medical Writing' },
    { id: 'D06', name: 'Data Management' },
    { id: 'D07', name: 'Aggregate Reports' },
    { id: 'D08', name: 'Audit & Inspection' },
    { id: 'D09', name: 'System Validation' },
    { id: 'D10', name: 'Quality Systems' },
    { id: 'D11', name: 'Literature Surveillance' },
    { id: 'D12', name: 'Clinical Safety' },
    { id: 'D13', name: 'Product Safety' },
    { id: 'D14', name: 'Vendor Management' },
    { id: 'D15', name: 'AI in PV' },
  ];

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    setProgress({ current: 0, total: 0 });

    try {
      const domainsToLoad =
        selectedDomain === 'all' ? domains.map((d) => d.id) : [selectedDomain];

      // First pass: count total KSBs
      const allKSBsByDomain: {
        domainId: string;
        ksbs: CapabilityComponent[];
      }[] = [];
      let totalKSBs = 0;

      log.debug('Loading stats for domains:', domainsToLoad);

      for (const domainId of domainsToLoad) {
        const result = await getKSBsForDomain(domainId);
        if (!result.success || !result.ksbs) {
          log.warn(
            `Failed to load KSBs for domain ${domainId}:`,
            result.error
          );
          continue;
        }
        allKSBsByDomain.push({ domainId, ksbs: result.ksbs });
        totalKSBs += result.ksbs.length;
        log.debug(`Domain ${domainId} loaded ${result.ksbs.length} KSBs`);
      }

      log.debug('Total KSBs found:', totalKSBs);

      setProgress({ current: 0, total: totalKSBs });

      const allStats: DomainStats[] = [];
      const needsWork: CapabilityComponent[] = [];
      let processed = 0;

      for (const { domainId, ksbs } of allKSBsByDomain) {
        const domainName =
          domains.find((d) => d.id === domainId)?.name || domainId;

        let withResearch = 0;
        let productionReady = 0;
        let totalCoverage = 0;
        let totalQuality = 0;
        const blockerCounts: Record<string, number> = {};

        for (const ksb of ksbs) {
          // Check for research
          if (ksb.research?.citations && ksb.research.citations.length > 0) {
            withResearch++;
          }

          // Check coverage score
          const coverage = ksb.coverageScore?.overall || 0;
          totalCoverage += coverage;

          // Calculate quality
          const quality = ksb.research ? calculateQuality(ksb) : 0;
          totalQuality += quality;

          // Check production readiness
          const gateResult = await validateQualityGates(
            ksb,
            PRODUCTION_THRESHOLDS
          );
          if (gateResult.passed) {
            productionReady++;
          } else {
            // Track blockers
            gateResult.blockers.forEach((blocker) => {
              const type = blocker.split(':')[0].trim();
              blockerCounts[type] = (blockerCounts[type] || 0) + 1;
            });

            // Add to needs work list (limit to avoid overwhelming)
            if (needsWork.length < 50) {
              needsWork.push(ksb);
            }
          }

          // Update progress
          processed++;
          if (processed % 50 === 0 || processed === totalKSBs) {
            setProgress({ current: processed, total: totalKSBs });
          }
        }

        allStats.push({
          domainId,
          domainName,
          total: ksbs.length,
          withResearch,
          productionReady,
          avgCoverage:
            ksbs.length > 0 ? Math.round(totalCoverage / ksbs.length) : 0,
          avgQuality:
            ksbs.length > 0 ? Math.round(totalQuality / ksbs.length) : 0,
          blockers: Object.entries(blockerCounts)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count),
        });
      }

      setStats(allStats);
      setKsbsNeedingWork(needsWork);
    } catch (err) {
      log.error('Error loading stats:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard data'
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate quality score for a KSB
  const calculateQuality = (ksb: CapabilityComponent): number => {
    if (!ksb.research) return 0;

    let score = 0;
    const research = ksb.research;

    // Citations (30 points)
    score += Math.min((research.citations?.length || 0) * 10, 30);

    // Primary sources (30 points)
    score += Math.min((research.primarySourceCount || 0) * 15, 30);

    // Coverage areas (25 points)
    if (research.coverageAreas) {
      const covered = Object.values(research.coverageAreas).filter(
        Boolean
      ).length;
      score += (covered / 5) * 25;
    }

    // Authority (15 points)
    const authorityScores: Record<string, number> = {
      regulatory: 15,
      guidance: 12,
      industry_standard: 9,
      peer_reviewed: 6,
      expert_opinion: 3,
      internal: 0,
    };
    score += authorityScores[research.authorityLevel] || 0;

    return Math.min(Math.round(score), 100);
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomain]);

  // Calculate totals
  const totals = stats.reduce(
    (acc, s) => ({
      total: acc.total + s.total,
      withResearch: acc.withResearch + s.withResearch,
      productionReady: acc.productionReady + s.productionReady,
    }),
    { total: 0, withResearch: 0, productionReady: 0 }
  );

  const researchPct =
    totals.total > 0
      ? Math.round((totals.withResearch / totals.total) * 100)
      : 0;
  const productionPct =
    totals.total > 0
      ? Math.round((totals.productionReady / totals.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <BarChart3 className="h-5 w-5" />
            Research Quality Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitor research coverage and production readiness across KSBs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {domains.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.id} - {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading Progress */}
      {loading && progress.total > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Analyzing KSBs...</span>
                <span>
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>
              <Progress
                value={(progress.current / progress.total) * 100}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {progress.current} of {progress.total} processed
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total KSBs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.total}</div>
            <p className="text-xs text-muted-foreground">
              Across {stats.length} domain{stats.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1 text-sm font-medium">
              <FileText className="h-4 w-4" />
              With Research
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.withResearch}</div>
            <div className="mt-1 flex items-center gap-2">
              <Progress value={researchPct} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground">
                {researchPct}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1 text-sm font-medium">
              <Shield className="h-4 w-4" />
              Production Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.productionReady}</div>
            <div className="mt-1 flex items-center gap-2">
              <Progress value={productionPct} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground">
                {productionPct}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain Breakdown */}
      {stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Domain Breakdown</CardTitle>
            <CardDescription>
              Research coverage and quality by domain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.map((s) => (
                <div key={s.domainId} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium">{s.domainId}</div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Progress
                        value={(s.productionReady / s.total) * 100}
                        className="h-2 flex-1"
                      />
                      <span className="w-12 text-xs text-muted-foreground">
                        {s.productionReady}/{s.total}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Avg Coverage: {s.avgCoverage}%</span>
                      <span>|</span>
                      <span>Avg Quality: {s.avgQuality}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {s.productionReady === s.total ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : s.productionReady > s.total * 0.5 ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KSBs Needing Work */}
      {ksbsNeedingWork.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              KSBs Needing Research
            </CardTitle>
            <CardDescription>
              {ksbsNeedingWork.length} KSBs don't meet production thresholds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {ksbsNeedingWork.slice(0, 20).map((ksb) => (
                <div
                  key={ksb.id}
                  className="flex cursor-pointer items-center justify-between rounded border p-2 hover:bg-accent"
                  onClick={() => onSelectKSB?.(ksb)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {ksb.itemName}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{ksb.id}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {ksb.coverageScore?.overall || 0}% coverage
                      </Badge>
                    </div>
                  </div>
                  <div className="ml-2 flex items-center gap-1">
                    {!ksb.research?.citations?.length && (
                      <Badge variant="destructive" className="text-[10px]">
                        No research
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {ksbsNeedingWork.length > 20 && (
                <div className="py-2 text-center text-xs text-muted-foreground">
                  And {ksbsNeedingWork.length - 20} more...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Debug Info */}
      <div className="mt-8 rounded border bg-slate-100 p-4 font-mono text-xs">
        <h3 className="mb-2 font-bold">Debug Info</h3>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>Error: {error || 'None'}</p>
        <p>Selected Domain: {selectedDomain}</p>
        <p>Stats Loaded: {stats.length}</p>
        <pre className="mt-2 max-h-60 overflow-auto">
          {JSON.stringify(stats, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default ResearchQualityDashboard;
