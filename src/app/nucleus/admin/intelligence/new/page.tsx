'use client';

import { PenLine } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/navigation';
import { IntelligenceForm } from '../components/intelligence-form';

export default function NewIntelligencePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-golden-4">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/nucleus/admin' },
          { label: 'Intelligence', href: '/nucleus/admin/intelligence' },
          { label: 'New Content' },
        ]}
        className="mb-golden-3"
      />

      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 bg-gold/5">
            <PenLine className="h-5 w-5 text-gold" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-gold/60">
              AlgoVigilance Admin
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Create Content
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Add new content to the Intelligence hub
        </p>
      </header>

      <IntelligenceForm mode="create" />
    </div>
  );
}
