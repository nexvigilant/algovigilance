'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  TrendingUp,
  Users,
  Gift,
  History,
  X,
  ArrowLeft,
} from 'lucide-react';
import { VoiceLoading, VoiceEmptyStateCompact } from '@/components/voice';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { RARITY_COLORS } from '@/lib/community-constants';
import {
  getAllBadgesWithStats,
  getBadgeAnalytics,
  getBadgeAdminHistory,
  type BadgeWithStats,
  type BadgeAnalytics,
} from './actions';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

import { AwardBadgeModal } from './components/award-badge-modal';
import { BadgeDetailModal } from './components/badge-detail-modal';

import { logger } from '@/lib/logger';
const log = logger.scope('badges/page');

export default function BadgesAdminPage() {
  const [badges, setBadges] = useState<BadgeWithStats[]>([]);
  const [analytics, setAnalytics] = useState<BadgeAnalytics | null>(null);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof getBadgeAdminHistory>>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStats | null>(null);
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [badgesData, analyticsData, historyData] = await Promise.all([
        getAllBadgesWithStats(),
        getBadgeAnalytics(),
        getBadgeAdminHistory(),
      ]);
      setBadges(badgesData);
      setAnalytics(analyticsData);
      setHistory(historyData);
    } catch (error) {
      log.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load badge data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <VoiceLoading context="admin" variant="fullpage" message="Loading badge data..." />;
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/nucleus/admin/community"
          className="mb-4 inline-flex items-center text-sm text-slate-dim hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Community Admin
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 font-headline text-3xl font-bold text-gold">
              Badge Management
            </h1>
            <p className="text-slate-dim">
              View badge statistics, award badges manually, and track activity.
            </p>
          </div>
          <Button onClick={() => setAwardModalOpen(true)}>
            <Gift className="mr-2 h-4 w-4" />
            Award Badge
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-purple-500/10 p-3">
                  <Award className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-dim">Total Awarded</p>
                  <p className="text-2xl font-bold">
                    {analytics.totalBadgesAwarded}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-dim">Users with Badges</p>
                  <p className="text-2xl font-bold">
                    {analytics.uniqueUsersWithBadges}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-dim">Most Popular</p>
                  <p className="text-lg font-bold truncate">
                    {analytics.mostAwardedBadges[0]?.badgeId
                      ? badges.find(
                          (b) => b.id === analytics.mostAwardedBadges[0].badgeId
                        )?.name || 'N/A'
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-yellow-500/10 p-3">
                  <History className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-dim">Admin Actions</p>
                  <p className="text-2xl font-bold">{history.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="library" className="space-y-6">
        <TabsList>
          <TabsTrigger value="library">Badge Library</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="history">Admin History</TabsTrigger>
        </TabsList>

        {/* Badge Library */}
        <TabsContent value="library">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {badges.map((badge) => (
              <Card
                key={badge.id}
                className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                onClick={() => {
                  setSelectedBadge(badge);
                  setDetailModalOpen(true);
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{badge.icon}</span>
                      <div>
                        <h3 className="font-semibold">{badge.name}</h3>
                        <p className="text-sm text-slate-dim">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                    <Badge
                      style={{
                        backgroundColor: `${RARITY_COLORS[badge.rarity]}20`,
                        color: RARITY_COLORS[badge.rarity],
                        borderColor: RARITY_COLORS[badge.rarity],
                      }}
                      variant="outline"
                    >
                      {badge.rarity}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <div>
                      <p className="text-2xl font-bold">{badge.totalAwarded}</p>
                      <p className="text-xs text-slate-dim">
                        times awarded
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm capitalize text-slate-dim">
                        {badge.category}
                      </p>
                      <p className="text-xs text-slate-dim">
                        {badge.requirement.type}: {badge.requirement.count}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recent Activity */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Recent Badge Awards</CardTitle>
              <CardDescription className="text-slate-dim">
                Latest badges earned across the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {badges.find((b) => b.id === activity.badgeId)?.icon ||
                            '🏆'}
                        </span>
                        <div>
                          <p className="font-medium">{activity.userName}</p>
                          <p className="text-sm text-slate-dim">
                            earned {activity.badgeName}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-dim">
                        {formatDistanceToNow(activity.awardedAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-slate-dim">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-light">Admin Action History</CardTitle>
              <CardDescription className="text-slate-dim">
                Manual badge awards and revocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'rounded-full p-2',
                            action.type === 'award'
                              ? 'bg-green-500/10'
                              : 'bg-red-500/10'
                          )}
                        >
                          {action.type === 'award' ? (
                            <Gift className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {action.type === 'award' ? 'Awarded' : 'Revoked'}{' '}
                            <span className="text-cyan">
                              {action.badgeName}
                            </span>{' '}
                            {action.type === 'award' ? 'to' : 'from'}{' '}
                            {action.userName}
                          </p>
                          <p className="text-sm text-slate-dim">
                            by {action.adminName} • {action.reason}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-dim">
                        {formatDistanceToNow(action.createdAt, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <VoiceEmptyStateCompact
                  context="badges"
                  description="No admin actions yet"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Award Badge Modal */}
      <AwardBadgeModal
        open={awardModalOpen}
        onOpenChange={setAwardModalOpen}
        badges={badges}
        onSuccess={() => {
          loadData();
          toast({
            title: 'Badge Awarded',
            description: 'The badge has been successfully awarded.',
          });
        }}
      />

      {/* Badge Detail Modal */}
      <BadgeDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        badge={selectedBadge}
        onAward={() => {
          setDetailModalOpen(false);
          setAwardModalOpen(true);
        }}
      />
    </div>
  );
}

