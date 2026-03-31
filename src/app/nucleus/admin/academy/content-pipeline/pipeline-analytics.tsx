'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Zap,
  Clock,
  Activity,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getPipelineAnalytics, getPipelineTrends, type PipelineStats, type TrendData } from './analytics-actions';

// Brand-compliant color palette
const COLORS = {
  cyan: 'hsl(189 100% 50%)',
  gold: 'hsl(42 89% 60%)',
  emerald: 'hsl(160 84% 39%)',
  violet: 'hsl(263 70% 50%)',
  rose: 'hsl(346 77% 49%)',
  slate: 'hsl(210 53% 23%)',
};

const ENGINE_COLORS = {
  red_pen: COLORS.rose,
  triage: COLORS.gold,
  synthesis: COLORS.violet,
};

const STATUS_COLORS = {
  completed: COLORS.emerald,
  failed: COLORS.rose,
  processing: COLORS.cyan,
  queued: COLORS.slate,
  cancelled: COLORS.gold,
};

export function PipelineAnalytics() {
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    setError(null);

    const [statsResult, trendsResult] = await Promise.all([
      getPipelineAnalytics(),
      getPipelineTrends(30),
    ]);

    if (statsResult.success && statsResult.stats) {
      setStats(statsResult.stats);
    } else {
      setError(statsResult.error || 'Failed to load analytics');
    }

    if (trendsResult.success && trendsResult.trends) {
      setTrends(trendsResult.trends);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card className="bg-rose-500/10 border-rose-500/30">
        <CardContent className="pt-6">
          <p className="text-rose-400">{error || 'No data available'}</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const _statusData = Object.entries(stats.byStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    fill: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || COLORS.slate,
  }));

  const engineData = Object.entries(stats.byEngine).map(([engine, data]) => ({
    name: engine === 'red_pen' ? 'Red Pen' : engine === 'triage' ? 'Triage' : 'Synthesis',
    total: data.total,
    success: data.success,
    failed: data.failed,
    fill: ENGINE_COLORS[engine as keyof typeof ENGINE_COLORS],
  }));

  const qualityData = [
    { name: 'Excellent (80-100)', value: stats.qualityDistribution.excellent, fill: COLORS.emerald },
    { name: 'Good (60-79)', value: stats.qualityDistribution.good, fill: COLORS.cyan },
    { name: 'Fair (40-59)', value: stats.qualityDistribution.fair, fill: COLORS.gold },
    { name: 'Needs Work (0-39)', value: stats.qualityDistribution.needsWork, fill: COLORS.rose },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-nex-surface border-nex-light">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-dim">Total Batches</p>
                <p className="text-2xl font-bold text-slate-light">{stats.overview.totalBatches}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-violet-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-dim">Total Jobs</p>
                <p className="text-2xl font-bold text-slate-light">{stats.overview.totalJobs}</p>
              </div>
              <Zap className="h-8 w-8 text-gold" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-dim">Success Rate</p>
                <p className="text-2xl font-bold text-emerald-400">{stats.overview.successRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-dim">Avg Duration</p>
                <p className="text-2xl font-bold text-slate-light">{stats.overview.avgJobDuration}s</p>
              </div>
              <Clock className="h-8 w-8 text-cyan" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="bg-nex-surface border border-nex-light">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="engines">Engines</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light flex items-center gap-2">
                <Activity className="h-5 w-5 text-violet-400" />
                Recent Activity (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.recentActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 53% 23%)" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(217 10% 64%)"
                      tick={{ fill: 'hsl(217 10% 64%)' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                    />
                    <YAxis stroke="hsl(217 10% 64%)" tick={{ fill: 'hsl(217 10% 64%)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(213 53% 11%)',
                        border: '1px solid hsl(210 53% 23%)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="jobsCreated" name="Created" fill={COLORS.violet} />
                    <Bar dataKey="jobsCompleted" name="Completed" fill={COLORS.emerald} />
                    <Bar dataKey="jobsFailed" name="Failed" fill={COLORS.rose} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Trend Line */}
          {trends.length > 0 && (
            <Card className="bg-nex-surface border-nex-light">
              <CardHeader>
                <CardTitle className="text-slate-light flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-cyan" />
                  Success Rate Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 53% 23%)" />
                      <XAxis
                        dataKey="period"
                        stroke="hsl(217 10% 64%)"
                        tick={{ fill: 'hsl(217 10% 64%)' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis stroke="hsl(217 10% 64%)" tick={{ fill: 'hsl(217 10% 64%)' }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(213 53% 11%)',
                          border: '1px solid hsl(210 53% 23%)',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="successRate"
                        name="Success Rate %"
                        stroke={COLORS.emerald}
                        strokeWidth={2}
                        dot={{ fill: COLORS.emerald }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="engines" className="space-y-4">
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light">Activity Engine Performance</CardTitle>
              <CardDescription className="text-slate-dim">
                Comparison of content generation by activity type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engineData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 53% 23%)" />
                    <XAxis type="number" stroke="hsl(217 10% 64%)" tick={{ fill: 'hsl(217 10% 64%)' }} />
                    <YAxis type="category" dataKey="name" stroke="hsl(217 10% 64%)" tick={{ fill: 'hsl(217 10% 64%)' }} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(213 53% 11%)',
                        border: '1px solid hsl(210 53% 23%)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="success" name="Success" stackId="a" fill={COLORS.emerald} />
                    <Bar dataKey="failed" name="Failed" stackId="a" fill={COLORS.rose} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Engine Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.byEngine).map(([engine, data]) => (
              <Card key={engine} className="bg-nex-surface border-nex-light">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg capitalize" style={{ color: ENGINE_COLORS[engine as keyof typeof ENGINE_COLORS] }}>
                    {engine === 'red_pen' ? 'Red Pen' : engine === 'triage' ? 'Triage' : 'Synthesis'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-dim">Total Jobs</span>
                      <span className="text-slate-light">{data.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-dim">Success</span>
                      <span className="text-emerald-400">{data.success}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-dim">Failed</span>
                      <span className="text-rose-400">{data.failed}</span>
                    </div>
                    <Progress
                      value={data.total > 0 ? (data.success / data.total) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="domains" className="space-y-4">
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light flex items-center gap-2">
                <Target className="h-5 w-5 text-gold" />
                Top Domains by Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.byDomain.length > 0 ? (
                <div className="space-y-4">
                  {stats.byDomain.map((domain, index) => (
                    <div key={domain.domainId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-dim w-6">#{index + 1}</span>
                          <span className="text-slate-light font-medium truncate max-w-[200px]">
                            {domain.domainName}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-slate-dim">{domain.totalJobs} jobs</span>
                          <span className={domain.successRate >= 80 ? 'text-emerald-400' : domain.successRate >= 50 ? 'text-gold' : 'text-rose-400'}>
                            {domain.successRate}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 h-2">
                        <div
                          className="bg-emerald-500 rounded-l"
                          style={{ width: `${(domain.completedJobs / domain.totalJobs) * 100}%` }}
                        />
                        <div
                          className="bg-rose-500 rounded-r"
                          style={{ width: `${(domain.failedJobs / domain.totalJobs) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-dim text-center py-8">No domain data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-nex-surface border-nex-light">
              <CardHeader>
                <CardTitle className="text-slate-light">Quality Distribution</CardTitle>
                <CardDescription className="text-slate-dim">
                  Content quality scores breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={qualityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {qualityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(213 53% 11%)',
                          border: '1px solid hsl(210 53% 23%)',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-nex-surface border-nex-light">
              <CardHeader>
                <CardTitle className="text-slate-light">Quality Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qualityData.map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-dim">{item.name}</span>
                        <span className="text-slate-light">{item.value} items</span>
                      </div>
                      <div className="h-2 bg-nex-dark rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(item.value / stats.overview.completedJobs) * 100}%`,
                            backgroundColor: item.fill,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Status Summary */}
          <Card className="bg-nex-surface border-nex-light">
            <CardHeader>
              <CardTitle className="text-slate-light">Current Job Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-nex-dark rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-dim text-sm">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">{stats.byStatus.completed}</p>
                </div>
                <div className="text-center p-4 bg-nex-dark rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-cyan" />
                    <span className="text-slate-dim text-sm">Processing</span>
                  </div>
                  <p className="text-2xl font-bold text-cyan">{stats.byStatus.processing}</p>
                </div>
                <div className="text-center p-4 bg-nex-dark rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.slate }} />
                    <span className="text-slate-dim text-sm">Queued</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-light">{stats.byStatus.queued}</p>
                </div>
                <div className="text-center p-4 bg-nex-dark rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-slate-dim text-sm">Failed</span>
                  </div>
                  <p className="text-2xl font-bold text-rose-400">{stats.byStatus.failed}</p>
                </div>
                <div className="text-center p-4 bg-nex-dark rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-gold" />
                    <span className="text-slate-dim text-sm">Cancelled</span>
                  </div>
                  <p className="text-2xl font-bold text-gold">{stats.byStatus.cancelled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
