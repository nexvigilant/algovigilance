'use client';

import { useState, useEffect, useRef } from 'react';
import { Users } from 'lucide-react';
import { MemberFilters } from '../components/members/member-filters';
import { MemberCard, MemberCardSkeleton } from '../components/members/member-card';
import { Button } from '@/components/ui/button';
import { getMembers, type MemberFilters as MemberFiltersType, type MemberDirectoryEntry } from '../actions/user/directory';
import { VoiceEmptyState } from '@/components/voice';

const ITEMS_PER_PAGE = 20;

export default function MembersDirectoryPage() {
  const [members, setMembers] = useState<MemberDirectoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<MemberFiltersType>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    async function loadInitialMembers() {
      setLoading(true);
      offsetRef.current = 0;

      const result = await getMembers({
        ...filters,
        limit: ITEMS_PER_PAGE,
        offset: 0,
      });

      if (result.success && result.members) {
        setMembers(result.members);
        setTotal(result.total || 0);
      }

      setLoading(false);
    }

    loadInitialMembers();
  }, [filters]);

  const handleFiltersChange = (newFilters: MemberFiltersType) => {
    setFilters(newFilters);
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const newOffset = offsetRef.current + ITEMS_PER_PAGE;

    const result = await getMembers({
      ...filters,
      limit: ITEMS_PER_PAGE,
      offset: newOffset,
    });

    if (result.success && result.members) {
      // Deduplicate members by userId to prevent duplicate entries
      setMembers((prev) => {
        const existingIds = new Set(prev.map(m => m.userId));
        const newMembers = (result.members ?? []).filter(m => !existingIds.has(m.userId));
        return [...prev, ...newMembers];
      });
      offsetRef.current = newOffset;
    }

    setLoadingMore(false);
  };

  const hasMore = members.length < total;

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col">
      {/* Header */}
      <div className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 bg-gold/5">
            <Users className="h-5 w-5 text-gold" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-gold/60">
              AlgoVigilance Network
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Member Directory
            </h1>
          </div>
        </div>
        <p className="text-golden-sm text-slate-dim/70 max-w-xl leading-golden">
          Connect with AlgoVigilances — vigilant professionals across the network
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <MemberFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </aside>

        {/* Member List */}
        <main className="flex-1">
          {/* Results Count */}
          <div className="mb-4 text-sm text-slate-dim">
            {loading ? (
              'Loading members...'
            ) : (
              <>
                Showing {members.length} of {total} members
              </>
            )}
          </div>

          {/* Members Grid */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <MemberCardSkeleton key={i} />
              ))}
            </div>
          ) : members.length === 0 ? (
            <VoiceEmptyState
              context="members"
              title="No members found"
              description="Try adjusting your filters to find more members"
            />
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <MemberCard key={member.userId} member={member} />
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="pt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="border-cyan text-cyan hover:bg-cyan/10"
                  >
                    {loadingMore ? 'Loading...' : `Load more (${total - members.length} remaining)`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
