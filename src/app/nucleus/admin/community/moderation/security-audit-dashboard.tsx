'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/layout/boundaries/empty-state';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Eye,
  RefreshCw,
  Ban,
  Loader2,
} from 'lucide-react';
import { VoiceLoading, VoiceEmptyState } from '@/components/voice';
import {
  getGuardianDashboardData,
  quarantineUser,
  type GuardianDashboardData,
  type AuditEvent,
} from './guardian-actions';
import { customToast } from '@/components/voice';

import { logger } from '@/lib/logger';
const log = logger.scope('moderation/security-audit');

/**
 * Guardian Protocol: Security Audit Dashboard
 *
 * Provides risk velocity visualization and hotspot identification
 * for proactive community safety monitoring.
 */

interface RiskVelocityChartProps {
  data: GuardianDashboardData['riskVelocity'];
  timeRange: '24h' | '7d' | '30d';
}

function RiskVelocityChart({ data, timeRange }: RiskVelocityChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        No risk data in selected timeframe
      </div>
    );
  }

  const maxScore = Math.max(...data.map((d) => d.score), 100);

  return (
    <div className="relative h-48 w-full">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 flex h-full w-8 flex-col justify-between text-xs text-muted-foreground">
        <span>{maxScore}</span>
        <span>{Math.round(maxScore / 2)}</span>
        <span>0</span>
      </div>

      {/* Chart area */}
      <div className="ml-10 flex h-full items-end gap-1">
        <TooltipProvider>
          {data.map((point, idx) => {
            const heightPercent = (point.score / maxScore) * 100;
            const isHighRisk = point.score >= 50;
            const isMediumRisk = point.score >= 30 && point.score < 50;

            return (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <div
                    className={`flex-1 min-w-[8px] max-w-[24px] rounded-t transition-all hover:opacity-80 cursor-pointer ${
                      isHighRisk
                        ? 'bg-red-500'
                        : isMediumRisk
                          ? 'bg-yellow-500'
                          : 'bg-cyan-500'
                    }`}
                    style={{ height: `${Math.max(heightPercent, 2)}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <p className="font-semibold">
                      {point.timestamp.toLocaleDateString()}{' '}
                      {timeRange === '24h' && point.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p>Avg Risk Score: {point.score}</p>
                    <p>Events: {point.eventCount}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-red-500" />
          <span>High Risk (50+)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-yellow-500" />
          <span>Medium (30-49)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-cyan-500" />
          <span>Low (&lt;30)</span>
        </div>
      </div>
    </div>
  );
}

function RiskFlagBadge({ flag }: { flag: string }) {
  const flagLabels: Record<string, { label: string; color: string }> = {
    short_query_harvesting: { label: 'Query Harvesting', color: 'bg-yellow-500/20 text-yellow-600' },
    suspicious_topic_metadata: { label: 'Suspicious Topics', color: 'bg-red-500/20 text-red-600' },
    rapid_actions: { label: 'Rapid Actions', color: 'bg-orange-500/20 text-orange-600' },
    bulk_operations: { label: 'Bulk Ops', color: 'bg-purple-500/20 text-purple-600' },
  };

  const config = flagLabels[flag] || { label: flag, color: 'bg-gray-500/20 text-gray-600' };

  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
}

export function SecurityAuditDashboard() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [data, setData] = useState<GuardianDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const [isQuarantining, setIsQuarantining] = useState<string | null>(null);

  async function handleQuarantine(userId: string, userName: string) {
    if (!window.confirm(`Are you sure you want to proactively quarantine ${userName}? This will restrict their account immediately.`)) {
      return;
    }

    setIsQuarantining(userId);
    try {
      const result = await quarantineUser(userId, 'Proactive quarantine via security dashboard hotspot analysis');
      if (result.success) {
        customToast.success('User quarantined and restricted');
        // Refresh data to reflect restriction
        await loadData(true);
      } else {
        customToast.error(result.error || 'Failed to quarantine user');
      }
    } catch (error) {
      log.error('Quarantine error:', error);
      customToast.error('An unexpected error occurred');
    } finally {
      setIsQuarantining(null);
    }
  }

  async function loadData(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await getGuardianDashboardData(timeRange);
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      log.error('Failed to load security audit data', { error });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectStream = () => {
      setIsStreaming(true);
      eventSource = new EventSource(
        `/nucleus/admin/community/moderation/guardian-stream?timeRange=${timeRange}`
      );

      eventSource.addEventListener('audit', (event) => {
        try {
          const parsed = JSON.parse((event as MessageEvent).data) as AuditEvent & { timestamp: string };
          const parsedEvent: AuditEvent = {
            ...parsed,
            timestamp: new Date(parsed.timestamp),
          };
          
          setData((prev) => {
            if (!prev) return prev;
            
            // 1. Update summary counts
            const newTotalEvents = prev.totalAuditEvents + 1;
            const isHighRisk = parsedEvent.risk.score >= 50;
            const newHighRiskEvents = prev.highRiskEvents + (isHighRisk ? 1 : 0);
            
            // 2. Incremental Average Risk Score
            const newAverageRiskScore = Math.round(
              (prev.averageRiskScore * prev.totalAuditEvents + parsedEvent.risk.score) / newTotalEvents
            );

            // 3. Update Risk Velocity (Chart Data)
            const velocityBucketMs = timeRange === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
            const eventBucketTime = Math.floor(parsedEvent.timestamp.getTime() / velocityBucketMs) * velocityBucketMs;
            
            let newRiskVelocity = [...prev.riskVelocity];
            const bucketIndex = newRiskVelocity.findIndex(p => p.timestamp.getTime() === eventBucketTime);
            
            if (bucketIndex >= 0) {
              const point = newRiskVelocity[bucketIndex];
              const newCount = point.eventCount + 1;
              newRiskVelocity[bucketIndex] = {
                ...point,
                eventCount: newCount,
                score: Math.round((point.score * point.eventCount + parsedEvent.risk.score) / newCount)
              };
            } else {
              newRiskVelocity.push({
                timestamp: new Date(eventBucketTime),
                score: parsedEvent.risk.score,
                eventCount: 1
              });
              newRiskVelocity.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            }

            // 4. Update Hotspots (User-level)
            let newHotspots = [...prev.hotspots];
            const hotspotIndex = newHotspots.findIndex(h => h.id === parsedEvent.userId);
            
            if (hotspotIndex >= 0) {
              const hotspot = newHotspots[hotspotIndex];
              const newCount = hotspot.eventCount + 1;
              newHotspots[hotspotIndex] = {
                ...hotspot,
                eventCount: newCount,
                riskScore: Math.round((hotspot.riskScore * hotspot.eventCount + parsedEvent.risk.score) / newCount)
              };
            } else if (parsedEvent.risk.score >= 30) {
              newHotspots.push({
                id: parsedEvent.userId,
                type: 'user',
                name: `User ${parsedEvent.userId.substring(0, 8)}...`,
                riskScore: parsedEvent.risk.score,
                eventCount: 1
              });
            }
            
            newHotspots = newHotspots
              .sort((a, b) => b.riskScore - a.riskScore)
              .slice(0, 5);

            // 5. Update Top Risk Flags
            let newTopRiskFlags = [...prev.topRiskFlags];
            parsedEvent.risk.flags.forEach(flag => {
              const flagIndex = newTopRiskFlags.findIndex(f => f.flag === flag);
              if (flagIndex >= 0) {
                newTopRiskFlags[flagIndex].count++;
              } else {
                newTopRiskFlags.push({ flag, count: 1 });
              }
            });
            newTopRiskFlags.sort((a, b) => b.count - a.count).slice(0, 5);

            return {
              ...prev,
              totalAuditEvents: newTotalEvents,
              highRiskEvents: newHighRiskEvents,
              averageRiskScore: newAverageRiskScore,
              recentEvents: [parsedEvent, ...prev.recentEvents].slice(0, 10),
              riskVelocity: newRiskVelocity,
              hotspots: newHotspots,
              topRiskFlags: newTopRiskFlags,
            };
          });
        } catch (error) {
          log.error('Failed to parse audit stream event', { error });
        }
      });

      eventSource.addEventListener('error', () => {
        setIsStreaming(false);
        eventSource?.close();
      });
    };

    connectStream();

    return () => {
      eventSource?.close();
      setIsStreaming(false);
    };
  }, [timeRange]);

  if (loading) {
    return <VoiceLoading context="admin" variant="inline" message="Loading security audit data..." />;
  }

  if (!data) {
    return (
        <EmptyState
          title="No Logs Found"
          description="Try adjusting your filters to find the logs you're looking for."
          context="members"
        />
    );
  }

  const riskTrend =
    data.riskVelocity.length >= 2
      ? data.riskVelocity[data.riskVelocity.length - 1].score -
        data.riskVelocity[Math.floor(data.riskVelocity.length / 2)].score
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold font-headline">Guardian Security Audit</h2>
            <p className="text-muted-foreground">Real-time risk monitoring and analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant="outline" className={isStreaming ? 'text-emerald-500 border-emerald-500/40' : 'text-muted-foreground'}>
            {isStreaming ? 'Live' : 'Offline'}
          </Badge>

          <Button variant="outline" size="icon" onClick={() => loadData(true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Audit Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-500" />
              <span className="text-3xl font-bold">{data.totalAuditEvents}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High Risk Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-3xl font-bold text-red-500">{data.highRiskEvents}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.totalAuditEvents > 0
                ? `${Math.round((data.highRiskEvents / data.totalAuditEvents) * 100)}% of total`
                : 'No events'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`h-5 w-5 rounded-full ${
                  data.averageRiskScore >= 50
                    ? 'bg-red-500'
                    : data.averageRiskScore >= 30
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
              />
              <span className="text-3xl font-bold">{data.averageRiskScore}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Risk Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {riskTrend > 0 ? (
                <TrendingUp className="h-5 w-5 text-red-500" />
              ) : riskTrend < 0 ? (
                <TrendingDown className="h-5 w-5 text-green-500" />
              ) : (
                <Activity className="h-5 w-5 text-yellow-500" />
              )}
              <span
                className={`text-3xl font-bold ${
                  riskTrend > 0 ? 'text-red-500' : riskTrend < 0 ? 'text-green-500' : ''
                }`}
              >
                {riskTrend > 0 ? '+' : ''}
                {riskTrend}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">vs. period midpoint</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Velocity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Velocity</CardTitle>
          <CardDescription>
            Average risk score over time • Higher bars indicate increased security concerns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RiskVelocityChart data={data.riskVelocity} timeRange={timeRange} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Risk Flags */}
        <Card>
          <CardHeader>
            <CardTitle>Top Risk Flags</CardTitle>
            <CardDescription>Most common security patterns detected</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topRiskFlags.length === 0 ? (
              <p className="text-muted-foreground">No risk flags in this period</p>
            ) : (
              <div className="space-y-3">
                {data.topRiskFlags.map((item) => (
                  <div key={item.flag} className="flex items-center justify-between">
                    <RiskFlagBadge flag={item.flag} />
                    <span className="text-sm font-semibold">{item.count} occurrences</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Hotspots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Hotspots
            </CardTitle>
            <CardDescription>Users with elevated risk activity</CardDescription>
          </CardHeader>
          <CardContent>
            {data.hotspots.length === 0 ? (
              <p className="text-muted-foreground">No hotspots detected</p>
            ) : (
              <div className="space-y-3">
                {data.hotspots.map((hotspot) => (
                  <div
                    key={hotspot.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{hotspot.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {hotspot.eventCount} flagged events
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          hotspot.riskScore >= 50
                            ? 'bg-red-500/20 text-red-600'
                            : 'bg-yellow-500/20 text-yellow-600'
                        }
                      >
                        Score: {hotspot.riskScore}
                      </Badge>
                      <Button variant="ghost" size="icon" title="View details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        title="Proactive Quarantine"
                        onClick={() => handleQuarantine(hotspot.id, hotspot.name)}
                        disabled={isQuarantining === hotspot.id}
                      >
                        {isQuarantining === hotspot.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Ban className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent High-Risk Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>Latest flagged activities requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentEvents.length === 0 ? (
            <VoiceEmptyState
              context="posts"
              title="No security events"
              description="The community is operating within normal parameters"
              variant="inline"
              size="sm"
            />
          ) : (
            <div className="space-y-2">
              {data.recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        event.risk.score >= 50
                          ? 'bg-red-500'
                          : event.risk.score >= 30
                            ? 'bg-yellow-500'
                            : 'bg-cyan-500'
                      }`}
                    />
                    <div>
                      <p className="font-medium">{event.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        User: {event.userId.substring(0, 12)}... •{' '}
                        {event.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.risk.flags.slice(0, 2).map((flag) => (
                      <RiskFlagBadge key={flag} flag={flag} />
                    ))}
                    <Badge variant="outline">Score: {event.risk.score}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
