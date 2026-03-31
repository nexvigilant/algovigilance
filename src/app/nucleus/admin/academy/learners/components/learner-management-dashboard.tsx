'use client';

import { useState, useEffect } from 'react';
import { Users, AlertTriangle, Shield, Clock, Search, Plus, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getLearners, getLearnerStats, getModerationStats, getModerationCases, getAppeals } from '@/lib/actions/learners';
import type { LearnerProfile, LearnerFilters, ModerationCase, Appeal, LearnerStats, ModerationStats } from '@/types/learner-management';
import { LearnerTable } from './learner-table';
import { ModerationQueue } from './moderation-queue';
import { AppealsQueue } from './appeals-queue';
import { AIModerationDashboard } from './ai-moderation-dashboard';

import { logger } from '@/lib/logger';
const log = logger.scope('components/learner-management-dashboard');

export function LearnerManagementDashboard() {
  const [activeTab, setActiveTab] = useState('learners');
  const [learners, setLearners] = useState<LearnerProfile[]>([]);
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [learnerStats, setLearnerStats] = useState<LearnerStats | null>(null);
  const [modStats, setModStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<LearnerFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function loadData() {
    setLoading(true);
    try {
      const [learnersData, statsData, modStatsData, casesData, appealsData] = await Promise.all([
        getLearners({ ...filters, search: searchQuery }),
        getLearnerStats(),
        getModerationStats(),
        getModerationCases({ status: ['open', 'in_review', 'escalated'] }),
        getAppeals('pending'),
      ]);

      setLearners(learnersData);
      setLearnerStats(statsData);
      setModStats(modStatsData);
      setCases(casesData);
      setAppeals(appealsData);
    } catch (error) {
      log.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadData();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Learner Management</h1>
          <p className="text-muted-foreground">
            Manage learners, handle moderation, and review appeals
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Learner
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Learners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learnerStats?.totalLearners || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{learnerStats?.newThisWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modStats?.openCases || 0}</div>
            {modStats?.criticalCases ? (
              <p className="text-xs text-destructive">
                {modStats.criticalCases} critical
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No critical cases</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Appeals</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modStats?.pendingAppeals || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modStats?.avgResolutionTime || 0}h</div>
            <p className="text-xs text-muted-foreground">
              {modStats?.resolvedToday || 0} resolved today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="learners" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Learners
            <Badge variant="secondary" className="ml-1">
              {learnerStats?.totalLearners || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Moderation
            {modStats?.openCases ? (
              <Badge variant="destructive" className="ml-1">
                {modStats.openCases}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="appeals" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Appeals
            {modStats?.pendingAppeals ? (
              <Badge variant="secondary" className="ml-1">
                {modStats.pendingAppeals}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learners" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>

            <div className="flex gap-2">
              <Select
                value={filters.sortBy}
                onValueChange={(value) => setFilters({ ...filters, sortBy: value as LearnerFilters['sortBy'] })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Join Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="lastActivity">Last Active</SelectItem>
                  <SelectItem value="warnings">Warnings</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.role?.[0] || 'all'}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    role: value === 'all' ? undefined : [value],
                  })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="practitioner">Practitioner</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status?.[0] || 'all'}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    status: value === 'all' ? undefined : [value],
                  })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Learner Table */}
          <LearnerTable
            learners={learners}
            loading={loading}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="moderation">
          <ModerationQueue
            cases={cases}
            loading={loading}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="appeals">
          <AppealsQueue
            appeals={appeals}
            loading={loading}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="ai">
          <AIModerationDashboard onRefresh={loadData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
