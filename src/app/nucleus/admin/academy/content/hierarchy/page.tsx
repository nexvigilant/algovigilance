import { Suspense } from 'react';
import { getContentHierarchy } from './actions';
import { HierarchyTree } from './hierarchy-tree';
import { HierarchyStats } from './hierarchy-stats';

export const metadata = {
  title: 'Content Hierarchy | Academy Admin',
  description: 'View and manage content structure: CPA → EPA → Domain → KSBs',
};

export default async function ContentHierarchyPage() {
  const hierarchy = await getContentHierarchy();

  return (
    <div className="mx-auto max-w-7xl px-4 py-golden-4">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 bg-gold/5">
            <span className="text-gold text-lg font-bold" aria-hidden="true">H</span>
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-gold/60">
              AlgoVigilance Admin
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Content Hierarchy
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Navigate content structure from Career Pathway Activities down to individual
          Knowledge, Skills, and Behaviors
        </p>
      </header>

      <div className="mb-golden-4">
        <HierarchyStats stats={hierarchy.stats} />
      </div>

      {/* Hierarchy Tree */}
      <div className="bg-nex-surface border border-nex-light">
        <div className="p-golden-3 border-b border-nex-light">
          <h2 className="text-lg font-semibold text-slate-light">
            Learning Hierarchy
          </h2>
          <p className="text-sm text-slate-light/70">
            CPA → EPA → Domain → KSBs
          </p>
        </div>
        <Suspense
          fallback={
            <div className="p-8 text-center text-slate-light/50">
              Loading hierarchy...
            </div>
          }
        >
          <HierarchyTree hierarchy={hierarchy} />
        </Suspense>
      </div>

      {/* Orphan Items */}
      {(hierarchy.orphanEPAs.length > 0 || hierarchy.orphanDomains.length > 0) && (
        <div className="mt-golden-4 bg-amber-900/20 border border-amber-600/30 p-golden-3">
          <h3 className="text-lg font-semibold text-amber-400 mb-4">
            Unlinked Items
          </h3>

          {hierarchy.orphanEPAs.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-amber-300 mb-2">
                EPAs not linked to any CPA ({hierarchy.orphanEPAs.length})
              </h4>
              <ul className="text-sm text-slate-light/70 space-y-1">
                {hierarchy.orphanEPAs.map((epa) => (
                  <li key={epa.id} className="flex items-center gap-2">
                    <span className="text-amber-400">{epa.id}</span>
                    <span>{epa.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hierarchy.orphanDomains.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-300 mb-2">
                Domains not linked to any EPA ({hierarchy.orphanDomains.length})
              </h4>
              <ul className="text-sm text-slate-light/70 space-y-1">
                {hierarchy.orphanDomains.map((domain) => (
                  <li key={domain.id} className="flex items-center gap-2">
                    <span className="text-amber-400">{domain.id}</span>
                    <span>{domain.name}</span>
                    <span className="text-slate-light/50">
                      ({domain.ksbCount} KSBs)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
