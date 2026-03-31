'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FolderKanban,
  Activity,
  Plus,
  Globe,
  Lock,
  Eye,
  UserPlus,
  ChevronRight,
} from 'lucide-react';
import {
  type Circle,
  type CircleMember,
  type Project,
  type FeedEntry,
  getCircle,
  listMembers,
  listProjects,
  getFeed,
  postToFeed,
  joinCircle,
  inviteMembers,
} from '@/lib/api/circles-api';
import { useAuth } from '@/hooks/use-auth';
import { TabErrorBoundary } from '@/app/nucleus/community/components/tab-error-boundary';
import { MembersTab } from './members-tab';
import { OfficerDashboardTab } from './officer-dashboard-tab';
import { TasksTab } from './tasks-tab';
import { EventsTab } from './events-tab';
import { DocumentsTab } from './documents-tab';
import { TransitionsTab } from './transitions-tab';
import { SettingsTab } from './settings-tab';

interface CircleWorkspaceProps {
  circleId: string;
}

const VISIBILITY_ICONS: Record<string, typeof Globe> = {
  Public: Globe,
  SemiPrivate: Eye,
  Private: Lock,
};

const STAGE_ORDER = ['Initiate','Design','Execute','Analyze','Report','Review','Publish','Closed'];

function formatUserId(uid: string): string {
  return uid.length > 16 ? `${uid.slice(0, 8)}...${uid.slice(-4)}` : uid;
}

function VisibilityBadge({ visibility }: { visibility: string }) {
  const Icon = VISIBILITY_ICONS[visibility] ?? Globe;
  return (
    <Badge variant="outline" className="border-cyan/30 text-cyan-soft/70 gap-1">
      <Icon className="h-3 w-3" />
      {visibility}
    </Badge>
  );
}

function StagePipeline({ stage }: { stage: string }) {
  const activeIdx = STAGE_ORDER.indexOf(stage);
  return (
    <div className="flex items-center gap-1">
      {STAGE_ORDER.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div
            className={`h-2 w-2 rounded-full ${
              i < activeIdx
                ? 'bg-emerald-500'
                : i === activeIdx
                  ? 'bg-cyan'
                  : 'bg-nex-light'
            }`}
            title={s}
          />
          {i < STAGE_ORDER.length - 1 && (
            <div className="h-px w-3 bg-nex-light" />
          )}
        </div>
      ))}
    </div>
  );
}

function ProjectCard({ project, circleId }: { project: Project; circleId: string }) {
  return (
    <Link href={`/nucleus/community/circles/${circleId}/projects/${project.id}`}>
      <Card className="border border-nex-light bg-nex-surface p-4 transition-colors hover:border-cyan/30">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="font-medium text-white">{project.name}</h3>
          <Badge
            variant="outline"
            className={`text-xs ${
              project.status === 'Active'
                ? 'border-emerald-500/30 text-emerald-400'
                : project.status === 'Completed'
                  ? 'border-cyan/30 text-cyan-soft'
                  : 'border-nex-light text-cyan-soft/50'
            }`}
          >
            {project.status}
          </Badge>
        </div>
        <p className="mb-3 line-clamp-2 text-sm text-cyan-soft/60">
          {project.description}
        </p>
        <div className="flex items-center justify-between">
          <StagePipeline stage={project.stage} />
          <span className="text-xs text-cyan-soft/40">{project.project_type}</span>
        </div>
      </Card>
    </Link>
  );
}

const AUTO_TYPES = new Set(['MemberJoined','MemberLeft','ProjectCreated','ProjectStageAdvanced','ProjectCompleted','DeliverableSubmitted','DeliverableApproved','SignalDetected','ReviewCompleted']);
function FeedItem({ entry }: { entry: FeedEntry }) {
  const isAutomated = AUTO_TYPES.has(entry.entry_type);

  return (
    <div className="border-b border-nex-light/50 py-3 last:border-0">
      <div className="mb-1 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan/20 text-xs text-cyan">
          {entry.actor_user_id.slice(0, 2).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-white">{formatUserId(entry.actor_user_id)}</span>
        {isAutomated && (
          <Badge variant="outline" className="border-nex-light text-cyan-soft/40 text-[10px]">
            auto
          </Badge>
        )}
        <span className="ml-auto text-xs text-cyan-soft/40">
          {new Date(entry.created_at).toLocaleDateString()}
        </span>
      </div>
      <p className="pl-8 text-sm text-cyan-soft/70">{entry.content}</p>
    </div>
  );
}

export function CircleWorkspace({ circleId }: CircleWorkspaceProps) {
  const { user } = useAuth();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [feedDisplayCount, setFeedDisplayCount] = useState(50);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [circleRes, membersRes, projectsRes, feedRes] = await Promise.all([
        getCircle(circleId),
        listMembers(circleId),
        listProjects(circleId),
        getFeed(circleId),
      ]);
      if (circleRes.data) setCircle(circleRes.data);
      if (membersRes.data) setMembers(membersRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (feedRes.data) setFeed(feedRes.data);
    } catch {
      setLoadError('Failed to load circle data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [circleId]);
  useEffect(() => { void loadData(); }, [loadData]);
  const handleJoin = async () => {
    if (!user?.uid) return;
    const res = await joinCircle(circleId, user.uid);
    if (res.success) void loadData();
  };
  const handlePost = async () => {
    if (!postContent.trim() || !user?.uid) return;
    setPosting(true);
    const res = await postToFeed(circleId, { actor_user_id: user.uid, content: postContent, entry_type: 'Discussion' });
    if (res.success) { setPostContent(''); void loadData(); }
    setPosting(false);
  };
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }
  if (loadError) {
    return (
      <Card className="border border-red-500/30 bg-nex-surface p-8 text-center">
        <p className="text-red-400">{loadError}</p>
        <button onClick={() => void loadData()} className="mt-4 rounded bg-cyan/20 px-4 py-2 text-cyan hover:bg-cyan/30">Retry</button>
      </Card>
    );
  }
  if (!circle) {
    return (
      <Card className="border border-cyan/30 bg-nex-surface p-8 text-center">
        <p className="text-cyan-soft/70">Circle not found or not accessible.</p>
      </Card>
    );
  }
  const isMember = members.some((m) => m.user_id === user?.uid && m.status === 'Active');
  const currentMember = members.find((m) => m.user_id === user?.uid);
  const canInvite = currentMember?.role ? ['Founder', 'Lead'].includes(currentMember.role) : false;
  const displayedFeed = feed.slice(0, feedDisplayCount);
  const hasMoreFeed = displayedFeed.length < feed.length;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6 border border-cyan/30 bg-nex-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h1 className="font-headline text-2xl font-bold text-white sm:text-3xl">
                {circle.name}
              </h1>
              <VisibilityBadge visibility={circle.visibility} />
            </div>
            {circle.mission && (
              <p className="mb-2 text-sm italic text-cyan-soft/60">{circle.mission}</p>
            )}
            <p className="mb-3 text-cyan-soft/70">{circle.description}</p>
            {circle.therapeutic_areas.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {circle.therapeutic_areas.map((ta) => (
                  <Badge key={ta} variant="outline" className="border-nex-gold-500/30 text-nex-gold-400 text-xs">
                    {ta}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-cyan-soft/60">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" /> {circle.member_count} members
              </span>
              <span className="flex items-center gap-1">
                <FolderKanban className="h-4 w-4" /> {circle.project_count} projects
              </span>
              <span className="text-xs text-cyan-soft/40">
                {circle.circle_type} &middot; {circle.formation}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {!isMember && (
              <Button
                onClick={handleJoin}
                className="bg-cyan-dark text-white hover:bg-cyan-dark/80"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Join Circle
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="dashboard" className="w-full">
        {/* Scrollable tab bar for mobile (SOW §1.3: mobile-first) */}
        <TabsList className="mb-4 flex w-full justify-start gap-0 overflow-x-auto border-b border-nex-light bg-transparent scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
          <TabsTrigger value="dashboard" className="shrink-0 data-[state=active]:border-b-2 data-[state=active]:border-cyan">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="tasks" className="shrink-0 data-[state=active]:border-b-2 data-[state=active]:border-cyan">
            Tasks
          </TabsTrigger>
          <TabsTrigger value="events" className="shrink-0 data-[state=active]:border-b-2 data-[state=active]:border-cyan">
            Events
          </TabsTrigger>
          <TabsTrigger value="feed" className="shrink-0 data-[state=active]:border-b-2 data-[state=active]:border-cyan">
            Feed
          </TabsTrigger>
          <TabsTrigger value="members" className="shrink-0 data-[state=active]:border-b-2 data-[state=active]:border-cyan">
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="shrink-0 data-[state=active]:border-b-2 data-[state=active]:border-cyan">
            Docs
          </TabsTrigger>
          <TabsTrigger value="overview" className="shrink-0 data-[state=active]:border-b-2 data-[state=active]:border-cyan">
            Overview
          </TabsTrigger>
          <TabsTrigger value="projects" className="shrink-0 data-[state=active]:border-b-2 data-[state=active]:border-cyan">
            Projects ({projects.length})
          </TabsTrigger>
          <TabsTrigger value="transitions" className="shrink-0 data-[state=active]:border-b-2 data-[state=active]:border-cyan">
            Transitions
          </TabsTrigger>
          <TabsTrigger value="settings" className="shrink-0 data-[state=active]:border-b-2 data-[state=active]:border-cyan">
            Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <TabErrorBoundary>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Members', value: circle.member_count },
              { label: 'Projects', value: circle.project_count },
              { label: 'Publications', value: circle.publication_count },
              { label: 'Active', value: projects.filter((p) => p.status === 'Active').length },
            ].map((stat) => (
              <Card key={stat.label} className="border border-nex-light bg-nex-surface p-4 text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-cyan-soft/60">{stat.label}</p>
              </Card>
            ))}
          </div>
          {projects.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-medium text-white">Recent Projects</h2>
                <Link
                  href={`/nucleus/community/circles/${circleId}/projects`}
                  className="flex items-center gap-1 text-sm text-cyan hover:text-cyan/80"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.slice(0, 4).map((p) => (
                  <ProjectCard key={p.id} project={p} circleId={circleId} />
                ))}
              </div>
            </div>
          )}
          {feed.length > 0 && (
            <Card className="border border-nex-light bg-nex-surface p-4">
              <h2 className="mb-3 text-lg font-medium text-white">Recent Activity</h2>
              {feed.slice(0, 5).map((entry) => (
                <FeedItem key={entry.id} entry={entry} />
              ))}
            </Card>
          )}
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="projects" className="space-y-4">
          <TabErrorBoundary>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Projects</h2>
            {isMember && (
              <Button
                asChild
                size="sm"
                className="bg-cyan-dark text-white hover:bg-cyan-dark/80"
              >
                <Link href={`/nucleus/community/circles/${circleId}/projects/create`}>
                  <Plus className="mr-2 h-4 w-4" /> New Project
                </Link>
              </Button>
            )}
          </div>
          {projects.length === 0 ? (
            <Card className="border border-nex-light bg-nex-surface p-8 text-center">
              <FolderKanban className="mx-auto mb-3 h-10 w-10 text-cyan-soft/30" />
              <p className="text-cyan-soft/60">No projects yet. Create the first one.</p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} circleId={circleId} />
              ))}
            </div>
          )}
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="members">
          <TabErrorBoundary>
            <MembersTab
              members={members}
              canInvite={canInvite}
              onInvite={async (userIds) => {
                if (!user?.uid) return { success: false, error: 'Not authenticated' };
                const res = await inviteMembers(circleId, { user_ids: userIds, invited_by: user.uid });
                if (res.success) void loadData();
                return { success: res.success, error: res.error };
              }}
            />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="feed" className="space-y-4">
          <TabErrorBoundary>
          {isMember && (
            <Card className="border border-nex-light bg-nex-surface p-4">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Share an update, ask a question..."
                className="mb-3 w-full resize-none rounded border border-nex-light bg-nex-deep p-3 text-sm text-white placeholder:text-cyan-soft/40 focus:border-cyan/50 focus:outline-none"
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handlePost}
                  disabled={posting || !postContent.trim()}
                  size="sm"
                  className="bg-cyan-dark text-white hover:bg-cyan-dark/80"
                >
                  {posting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </Card>
          )}
          <Card className="border border-nex-light bg-nex-surface p-4">
            {feed.length === 0 ? (
              <p className="py-8 text-center text-cyan-soft/60">
                <Activity className="mx-auto mb-3 h-10 w-10 text-cyan-soft/30" />
                No activity yet.
              </p>
            ) : (
              displayedFeed.map((entry) => <FeedItem key={entry.id} entry={entry} />)
            )}
            {hasMoreFeed && (
              <div className="mt-3 flex justify-center">
                <Button variant="outline" size="sm" className="border-nex-light text-cyan-soft/70" onClick={() => setFeedDisplayCount((c) => c + 50)}>Load More</Button>
              </div>
            )}
          </Card>
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="tasks">
          <TabErrorBoundary>
            <TasksTab circleId={circleId} />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="events">
          <TabErrorBoundary>
            <EventsTab circleId={circleId} />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="documents">
          <TabErrorBoundary>
            <DocumentsTab circleId={circleId} />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="dashboard">
          <TabErrorBoundary>
            <OfficerDashboardTab circleId={circleId} />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="transitions">
          <TabErrorBoundary>
            <TransitionsTab circleId={circleId} />
          </TabErrorBoundary>
        </TabsContent>
        <TabsContent value="settings">
          <TabErrorBoundary>
            <SettingsTab circleId={circleId} />
          </TabErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}
