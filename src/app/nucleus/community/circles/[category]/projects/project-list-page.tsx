'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FolderKanban } from 'lucide-react';
import { type Project, listProjects } from '@/lib/api/circles-api';
import { COMMUNITY_ROUTES } from '@/lib/routes';

interface ProjectListPageProps {
  circleId: string;
}

const STAGE_ORDER = ['Initiate', 'Design', 'Execute', 'Analyze', 'Report', 'Review', 'Publish', 'Closed'];

const STATUS_OPTIONS = ['all', 'Active', 'Completed', 'OnHold'] as const;
type StatusOption = (typeof STATUS_OPTIONS)[number];

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
      <span className="ml-2 text-xs text-cyan-soft/50">{stage}</span>
    </div>
  );
}

export function ProjectListPage({ circleId }: ProjectListPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusOption>('all');
  const [sortBy, setSortBy] = useState<'date' | 'stage'>('date');
  const [displayCount, setDisplayCount] = useState(20);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listProjects(circleId);
    if (res.data) setProjects(res.data);
    setLoading(false);
  }, [circleId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  const filtered = projects
    .filter((p) => statusFilter === 'all' || p.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'stage') {
        return STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const displayed = filtered.slice(0, displayCount);
  const hasMore = filtered.length > displayCount;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-headline text-2xl font-bold text-white">Projects</h1>
          <span className="text-xs text-cyan-soft/40">{filtered.length} projects</span>
        </div>
        <Button
          asChild
          size="sm"
          className="bg-cyan-dark text-white hover:bg-cyan-dark/80"
        >
          <Link href={COMMUNITY_ROUTES.circleProjectCreate(circleId)}>
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Link>
        </Button>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter(s);
                setDisplayCount(20);
              }}
              className={
                statusFilter === s
                  ? 'bg-cyan-dark text-white'
                  : 'border-nex-light text-cyan-soft/60 hover:text-white'
              }
            >
              {s === 'all' ? 'All' : s}
            </Button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'stage')}
          className="rounded border border-nex-light bg-nex-deep px-2 py-1 text-xs text-white"
        >
          <option value="date">Newest First</option>
          <option value="stage">By Stage</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <Card className="border border-nex-light bg-nex-surface p-12 text-center">
          <FolderKanban className="mx-auto mb-3 h-12 w-12 text-cyan-soft/30" />
          <p className="mb-2 text-lg font-medium text-white">
            {projects.length === 0 ? 'No projects yet' : 'No projects match this filter'}
          </p>
          <p className="text-sm text-cyan-soft/60">
            {projects.length === 0
              ? 'Create the first research project in this circle.'
              : 'Try a different status filter or sort order.'}
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {displayed.map((p) => (
              <Link
                key={p.id}
                href={COMMUNITY_ROUTES.circleProject(circleId, p.id)}
              >
                <Card className="border border-nex-light bg-nex-surface p-5 transition-colors hover:border-cyan/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-3">
                        <h2 className="text-lg font-medium text-white">{p.name}</h2>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            p.status === 'Active'
                              ? 'border-emerald-500/30 text-emerald-400'
                              : p.status === 'Completed'
                                ? 'border-cyan/30 text-cyan-soft'
                                : 'border-nex-light text-cyan-soft/50'
                          }`}
                        >
                          {p.status}
                        </Badge>
                      </div>
                      <p className="mb-3 text-sm text-cyan-soft/60">{p.description}</p>
                      <StagePipeline stage={p.stage} />
                    </div>
                    <div className="text-right text-xs text-cyan-soft/40">
                      <p>{p.project_type}</p>
                      {p.therapeutic_area && <p>{p.therapeutic_area}</p>}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {hasMore && (
            <Button
              variant="outline"
              onClick={() => setDisplayCount((c) => c + 20)}
              className="mt-4 w-full border-nex-light text-cyan-soft/70 hover:text-white"
            >
              Load More ({filtered.length - displayed.length} remaining)
            </Button>
          )}
        </>
      )}
    </div>
  );
}
