'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Globe, Users, Lock } from 'lucide-react';
import { type Publication, listPublications } from '@/lib/api/circles-api';
import { COMMUNITY_ROUTES } from '@/lib/routes';

const VISIBILITY_ICONS: Record<string, typeof Globe> = {
  Community: Globe,
  Circles: Users,
  Restricted: Lock,
};

const VISIBILITY_FILTERS = ['all', 'Community', 'Circles', 'Restricted'] as const;
type VisibilityFilter = (typeof VISIBILITY_FILTERS)[number];

export function PublicationsFeed() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visFilter, setVisFilter] = useState<VisibilityFilter>('all');
  const [displayCount, setDisplayCount] = useState(20);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listPublications();
    if (res.data) setPublications(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const q = search.toLowerCase();
  const filtered = publications
    .filter((p) => visFilter === 'all' || p.visibility === visFilter)
    .filter(
      (p) =>
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.abstract_text.toLowerCase().includes(q),
    )
    .sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );

  const displayed = filtered.slice(0, displayCount);
  const hasMore = displayed.length < filtered.length;

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-2 font-headline text-2xl font-bold text-white sm:text-3xl">
          Published Research
        </h1>
        <p className="text-cyan-soft/60">
          Browse findings published by research circles across the community.
        </p>
      </div>

      <div className="mb-4 space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setDisplayCount(20);
          }}
          placeholder="Search publications by title or abstract..."
          className="w-full rounded border border-nex-light bg-nex-deep px-3 py-2 text-sm text-white placeholder:text-cyan-soft/40 focus:border-cyan/50 focus:outline-none"
        />
        <div className="flex items-center gap-2">
          {VISIBILITY_FILTERS.map((v) => (
            <Button
              key={v}
              size="sm"
              variant={visFilter === v ? 'default' : 'outline'}
              onClick={() => {
                setVisFilter(v);
                setDisplayCount(20);
              }}
              className={
                visFilter === v
                  ? 'bg-cyan-dark text-white'
                  : 'border-nex-light text-cyan-soft/60 hover:text-white'
              }
            >
              {v === 'all' ? 'All' : v}
            </Button>
          ))}
          <span className="ml-auto text-xs text-cyan-soft/40">
            {filtered.length} publications
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border border-nex-light bg-nex-surface p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-12 w-12 text-cyan-soft/30" />
          <p className="mb-2 text-lg font-medium text-white">
            {publications.length === 0
              ? 'No publications yet'
              : 'No publications match your search'}
          </p>
          <p className="text-sm text-cyan-soft/60">
            {publications.length === 0
              ? 'Research publications from circles will appear here once published.'
              : 'Try adjusting your search or visibility filter.'}
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {displayed.map((pub) => {
              const VisIcon = VISIBILITY_ICONS[pub.visibility] ?? Globe;
              return (
                <Link key={pub.id} href={COMMUNITY_ROUTES.publication(pub.id)}>
                  <Card className="border border-nex-light bg-nex-surface p-5 transition-colors hover:border-cyan/30">
                    <div className="mb-2 flex items-start justify-between">
                      <h2 className="text-lg font-medium text-white">{pub.title}</h2>
                      <Badge
                        variant="outline"
                        className="gap-1 border-nex-light text-cyan-soft/60 text-xs"
                      >
                        <VisIcon className="h-3 w-3" />
                        {pub.visibility}
                      </Badge>
                    </div>
                    <p className="mb-3 text-sm text-cyan-soft/70">{pub.abstract_text}</p>
                    <div className="flex items-center gap-4 text-xs text-cyan-soft/40">
                      <span>
                        Published{' '}
                        {new Date(pub.published_at).toLocaleDateString()}
                      </span>
                      <span>By: {pub.published_by}</span>
                      <span>Circle: {pub.source_circle_id}</span>
                    </div>
                  </Card>
                </Link>
              );
            })}
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
