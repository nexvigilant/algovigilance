'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getRouteCrossLinks } from '@/data/route-map';

interface RelatedResourcesProps {
  /** Override the current pathname for cross-link lookup */
  path?: string;
}

/**
 * RelatedResources — Cross-domain navigation bar
 *
 * Reads crossLinks from the route map for the current (or specified) path.
 * Renders a compact horizontal bar: "Related: Observatory | Regulatory | Academy"
 */
export function RelatedResources({ path }: RelatedResourcesProps) {
  const pathname = usePathname();
  const currentPath = path ?? pathname;
  const relatedRoutes = getRouteCrossLinks(currentPath);

  if (relatedRoutes.length === 0) return null;

  return (
    <nav aria-label="Related resources" className="border-t border-nex-border/40 py-4 mt-8">
      <div className="flex items-center flex-wrap gap-x-1 gap-y-2">
        <span className="text-xs font-mono uppercase tracking-widest text-slate-dim/60 mr-2">
          Related
        </span>
        {relatedRoutes.map((route, i) => (
          <span key={route.path} className="inline-flex items-center">
            {i > 0 && <span className="text-slate-dim/30 mx-2" aria-hidden="true">|</span>}
            <Link
              href={route.path}
              className="text-sm text-cyan/70 hover:text-cyan transition-colors"
            >
              {route.label}
            </Link>
          </span>
        ))}
      </div>
    </nav>
  );
}
