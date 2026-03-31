import Link from 'next/link';
import { FileText, Rss, Bell, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/marketing';
import { TrackedLink } from '@/components/analytics/tracked-link';
import { ChangelogEntry } from '@/components/changelog';
import { getChangelogEntries, getTotalEntries } from '@/data/changelog-loader';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Changelog',
  description:
    'Stay up to date with the latest features, improvements, and fixes to the AlgoVigilance platform. Track our progress as we build the future of pharmaceutical professional development.',
  path: '/changelog',
  imageAlt: 'AlgoVigilance Changelog - Platform Updates',
});

/**
 * Initial entries to display before "Load More"
 * Prevents DOM bloat as changelog grows
 */
const INITIAL_ENTRIES = 5;

/**
 * Empty state component for when changelog has no entries
 */
function EmptyState() {
  return (
    <div className="py-16 text-center">
      <AlertCircle className="mx-auto h-12 w-12 text-slate-dim" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold text-slate-light">No Updates Yet</h2>
      <p className="mt-2 text-slate-dim">
        Check back soon for the latest platform updates and improvements.
      </p>
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{ all?: string }>;
}

export default async function ChangelogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const showAll = params.all === 'true';

  // Get entries with validation - throws if JSON structure is invalid
  const entries = getChangelogEntries();
  const totalEntries = getTotalEntries();
  const hasMoreEntries = !showAll && totalEntries > INITIAL_ENTRIES;

  // Show all entries if ?all=true, otherwise paginate
  const displayedEntries = showAll ? entries : entries.slice(0, INITIAL_ENTRIES);

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      {/* Hero Section */}
      <PageHero
        title="Changelog"
      />

      {/* Quick Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button asChild variant="outline" className="border-slate-dim text-slate-dim hover:bg-nex-surface touch-target">
          <Link href="/docs">
            <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
            View Docs
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="border-slate-dim text-slate-dim hover:bg-nex-surface touch-target"
        >
          <Link href="/changelog/feed">
            <Rss className="mr-2 h-4 w-4" aria-hidden="true" />
            RSS Feed
          </Link>
        </Button>
        <Button asChild variant="outline" className="border-cyan text-cyan hover:bg-cyan/10 touch-target">
          <TrackedLink href="/auth/signup" event="signup_started" properties={{ location: "changelog_top" }}>
            <Bell className="mr-2 h-4 w-4" aria-hidden="true" />
            Sign Up Free
          </TrackedLink>
        </Button>
      </div>

      {/* Empty State or Entries */}
      {entries.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Version / Description Headers */}
          <div className="mt-16 flex gap-8 border-b border-nex-light pb-4">
            <div className="w-32 flex-shrink-0 text-sm font-semibold text-slate-dim">
              Version
            </div>
            <div className="flex-1 text-sm font-semibold text-slate-dim">
              Description
            </div>
          </div>

          {/* Changelog Entries - key uses version+date to prevent collision on hotfixes */}
          <div className="divide-y divide-nex-light/30">
            {displayedEntries.map((entry) => (
              <ChangelogEntry key={`${entry.version}-${entry.date}`} entry={entry} />
            ))}
          </div>

          {/* Load More / View All indicator */}
          {hasMoreEntries && (
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-dim">
                Showing {displayedEntries.length} of {totalEntries} releases.
              </p>
              {/*
               * For full client-side pagination with smooth UX:
               * 1. Create a client component wrapper
               * 2. Use useState to toggle showAll
               * 3. Replace this link with an onClick handler
               */}
              <Button
                asChild
                variant="outline"
                className="mt-4 border-nex-light text-slate-dim hover:text-slate-light touch-target"
              >
                <Link href="/changelog?all=true">View All Releases</Link>
              </Button>
            </div>
          )}
        </>
      )}

      {/* Footer CTA */}
      <div className="mt-16 text-center">
        <Button asChild className="bg-cyan text-nex-dark hover:bg-cyan/90 touch-target">
          <TrackedLink href="/auth/signup" event="signup_started" properties={{ location: "changelog_bottom" }}>
            Join the Mission
          </TrackedLink>
        </Button>
      </div>
    </div>
  );
}
