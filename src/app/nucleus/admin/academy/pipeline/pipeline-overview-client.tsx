'use client';

import { useEffect, useState } from 'react';
import { getPipelineHealth, type PipelineHealth } from '@/lib/course-builder-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/branded/status-badge';
import { AlertCircle, Activity, Clock, CheckCircle } from 'lucide-react';

import { logger } from '@/lib/logger';
const log = logger.scope('pipeline/pipeline-overview-client');

export function PipelineOverview() {
  const [health, setHealth] = useState<PipelineHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch pipeline health
  const fetchHealth = async () => {
    try {
      const data = await getPipelineHealth();
      setHealth(data);
      setError(null);
      setLastUpdate(new Date());
    } catch (err: unknown) {
      log.error('Error fetching pipeline health:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchHealth();
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHealth();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Format uptime
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  // Status badge styling
  const getStatusBadge = (status: PipelineHealth['status']) => {
    return <StatusBadge status={status} />;
  };

  if (loading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pipeline Health</CardTitle>
          <CardDescription>Loading pipeline status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-8 border-destructive">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Pipeline Health
              </CardTitle>
              <CardDescription>Failed to connect to pipeline</CardDescription>
            </div>
            <Badge variant="destructive">Error</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchHealth}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Retry connection
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!health) return null;

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Pipeline Health
            </CardTitle>
            <CardDescription>
              Real-time monitoring · Last updated {lastUpdate.toLocaleTimeString()}
            </CardDescription>
          </div>
          {getStatusBadge(health.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Uptime */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Clock className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Uptime</p>
              <p className="text-2xl font-bold">{formatUptime(health.uptime_seconds)}</p>
            </div>
          </div>

          {/* Active Jobs */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Activity className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
              <p className="text-2xl font-bold">{health.active_jobs}</p>
            </div>
          </div>

          {/* Queued Jobs */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <AlertCircle className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Queued</p>
              <p className="text-2xl font-bold">{health.queued_jobs}</p>
            </div>
          </div>

          {/* Version */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="text-xl font-bold">{health.version}</p>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center mb-2">
              <div className={`h-3 w-3 rounded-full ${
                health.status === 'healthy' ? 'bg-green-500 animate-pulse' :
                health.status === 'degraded' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></div>
            </div>
            <p className="text-xs text-muted-foreground">System Status</p>
            <p className="text-sm font-medium capitalize">{health.status}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Pipeline Load</p>
            <p className="text-sm font-medium">
              {health.active_jobs + health.queued_jobs} total jobs
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Last Check</p>
            <p className="text-sm font-medium">
              {new Date(health.last_check).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
