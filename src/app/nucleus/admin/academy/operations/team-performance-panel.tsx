'use client';

import { useState, useEffect } from 'react';
import {
  Trophy,
  BarChart2,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  getTeamPerformanceStats,
  type TeamPerformanceStats,
  type TeamMemberMetrics,
} from '@/lib/actions/operations';

import { logger } from '@/lib/logger';
const log = logger.scope('operations/team-performance-panel');

export function TeamPerformancePanel() {
  const [stats, setStats] = useState<TeamPerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function fetchData() {
    try {
      const result = await getTeamPerformanceStats();
      if (result.success && result.stats) {
        setStats(result.stats);
      }
    } catch (error) {
      log.error('Failed to fetch team performance:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchData();
  }

  if (loading) {
    return (
      <Card className="bg-nex-surface border-nex-light">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-cyan" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.members.length === 0) {
    return (
      <Card className="bg-nex-surface border-nex-light">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan/10 rounded-lg">
              <BarChart2 className="h-5 w-5 text-cyan" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-light">Team Performance</CardTitle>
              <CardDescription className="text-slate-dim">
                No team assignments yet
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-dim text-center py-4">
            Assign domains to team members to see performance metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-nex-surface border-nex-light">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan/10 rounded-lg">
              <BarChart2 className="h-5 w-5 text-cyan" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-light">Team Performance</CardTitle>
              <CardDescription className="text-slate-dim">
                {stats.members.length} members • {stats.overallCompletionRate}% overall completion
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-slate-dim hover:text-cyan"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-slate-dim hover:text-cyan"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Quick Stats */}
      <CardContent className="pb-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-2 bg-nex-dark rounded-lg">
            <div className="text-xl font-bold text-slate-light">{stats.members.length}</div>
            <div className="text-xs text-slate-dim">Team Size</div>
          </div>
          <div className="text-center p-2 bg-nex-dark rounded-lg">
            <div className="text-xl font-bold text-emerald-400">{stats.totalAssignedDomains}</div>
            <div className="text-xs text-slate-dim">Assigned</div>
          </div>
          <div className="text-center p-2 bg-nex-dark rounded-lg">
            <div className="text-xl font-bold text-amber-400">{stats.totalUnassignedDomains}</div>
            <div className="text-xs text-slate-dim">Unassigned</div>
          </div>
          <div className="text-center p-2 bg-nex-dark rounded-lg">
            <div className="text-xl font-bold text-cyan">{stats.overallCompletionRate}%</div>
            <div className="text-xs text-slate-dim">Complete</div>
          </div>
        </div>

        {/* Top Performer Highlight */}
        {stats.topPerformer && (
          <div className="mt-4 p-3 bg-gold/5 border border-gold/20 rounded-lg flex items-center gap-3">
            <Trophy className="h-5 w-5 text-gold" />
            <div className="flex-1">
              <p className="text-sm text-slate-light">
                <span className="font-medium text-gold">{stats.topPerformer.name}</span> is leading
                with {stats.topPerformer.completionRate}% completion
              </p>
            </div>
          </div>
        )}
      </CardContent>

      {/* Expanded View */}
      {expanded && (
        <CardContent className="pt-0">
          <div className="border-t border-nex-light pt-4">
            <h4 className="text-sm font-medium text-slate-light mb-3">Team Leaderboard</h4>
            <ScrollArea className="h-[320px]">
              <div className="space-y-3">
                {stats.members.map((member, index) => (
                  <MemberPerformanceCard key={member.memberId} member={member} rank={index + 1} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function MemberPerformanceCard({ member, rank }: { member: TeamMemberMetrics; rank: number }) {
  const getRankColor = (r: number) => {
    if (r === 1) return 'text-gold bg-gold/10';
    if (r === 2) return 'text-slate-300 bg-slate-300/10';
    if (r === 3) return 'text-amber-600 bg-amber-600/10';
    return 'text-slate-dim bg-nex-dark';
  };

  return (
    <div className="p-3 bg-nex-dark rounded-lg border border-nex-light">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getRankColor(rank)}`}>
          {rank}
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-cyan/20 text-cyan text-xs">
            {member.memberName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-light truncate">{member.memberName}</p>
          <p className="text-xs text-slate-dim">{member.assignedDomains} domains</p>
        </div>
        <Badge
          variant="secondary"
          className={`text-xs ${
            member.completionRate >= 80
              ? 'bg-emerald-500/10 text-emerald-400'
              : member.completionRate >= 50
              ? 'bg-amber-500/10 text-amber-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          {member.completionRate}%
        </Badge>
      </div>

      <Progress value={member.completionRate} className="h-2 mb-3" />

      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div>
          <div className="font-medium text-slate-light">{member.totalKSBs}</div>
          <div className="text-slate-dim">Total</div>
        </div>
        <div>
          <div className="font-medium text-emerald-400">{member.publishedKSBs}</div>
          <div className="text-slate-dim">Done</div>
        </div>
        <div>
          <div className="font-medium text-amber-400">{member.reviewPending}</div>
          <div className="text-slate-dim">Review</div>
        </div>
        <div className="flex items-center justify-center gap-1">
          <Activity className="h-3 w-3 text-cyan" />
          <span className="font-medium text-cyan">{member.recentActivity}</span>
        </div>
      </div>
    </div>
  );
}
