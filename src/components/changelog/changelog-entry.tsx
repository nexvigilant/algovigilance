'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles, TrendingUp, Bug, Shield, Accessibility, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type ChangelogEntry as ChangelogEntryType,
  type ChangeItem,
  type ChangeType,
  CATEGORY_CONFIG,
} from '@/types/changelog';

interface ChangelogEntryProps {
  entry: ChangelogEntryType;
}

/**
 * Format a date string for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Generate a stable ID for aria-controls linking
 */
function generateSectionId(version: string, type: ChangeType): string {
  return `changelog-${version.replace(/\./g, '-')}-${type}`;
}

const CHANGE_TYPE_ICONS: Record<ChangeType, React.ComponentType<{ className?: string }>> = {
  feature: Sparkles,
  improvement: TrendingUp,
  fix: Bug,
  security: Shield,
  accessibility: Accessibility,
  breaking: AlertTriangle,
};

const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  feature: 'New Features',
  improvement: 'Improvements',
  fix: 'Bug Fixes',
  security: 'Security',
  accessibility: 'Accessibility',
  breaking: 'Breaking Changes',
};

interface ChangesSectionProps {
  type: ChangeType;
  items: ChangeItem[];
  sectionId: string;
  defaultOpen?: boolean;
}

function ChangesSection({ type, items, sectionId, defaultOpen = false }: ChangesSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Icon = CHANGE_TYPE_ICONS[type];
  const label = CHANGE_TYPE_LABELS[type];

  if (items.length === 0) return null;

  return (
    <div className="border-t border-nex-light/30 first:border-t-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-3 text-left transition-colors hover:bg-nex-surface/50"
        aria-expanded={isOpen}
        aria-controls={sectionId}
        aria-label={`${label}: ${items.length} ${items.length === 1 ? 'item' : 'items'}`}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn(
            'h-4 w-4',
            type === 'feature' && 'text-cyan',
            type === 'improvement' && 'text-gold',
            type === 'fix' && 'text-amber-500',
            type === 'security' && 'text-red-400',
            type === 'accessibility' && 'text-green-400',
            type === 'breaking' && 'text-red-500'
          )} aria-hidden="true" />
          <span className="text-sm font-medium text-slate-light">
            {label}
          </span>
          <span className="rounded-full bg-nex-light/50 px-2 py-0.5 text-xs text-slate-dim">
            {items.length}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-slate-dim" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-dim" aria-hidden="true" />
        )}
      </button>
      {isOpen && (
        <ul id={sectionId} className="space-y-2 pb-4 pl-6">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-dim" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-dim">{item.description}</span>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  CATEGORY_CONFIG[item.category].color
                )}>
                  {CATEGORY_CONFIG[item.category].label}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ChangelogEntry({ entry }: ChangelogEntryProps) {
  // Check if any changes exist (more efficient than counting all types)
  const hasChanges =
    entry.changes.features.length > 0 ||
    entry.changes.improvements.length > 0 ||
    entry.changes.fixes.length > 0 ||
    entry.changes.security.length > 0 ||
    entry.changes.accessibility.length > 0 ||
    entry.changes.breaking.length > 0;

  return (
    <article className="flex gap-8 py-8">
      {/* Version & Date Column */}
      <div className="w-32 flex-shrink-0">
        <div className={cn(
          'text-lg font-bold',
          entry.isMajor ? 'text-gold' : 'text-slate-light'
        )}>
          {entry.version}
        </div>
        <time dateTime={entry.date} className="text-sm text-slate-dim">
          {formatDate(entry.date)}
        </time>
      </div>

      {/* Content Column */}
      <div className="flex-1">
        <div className={cn(
          'rounded-xl border p-6',
          entry.isMajor
            ? 'border-gold/30 bg-gradient-to-br from-nex-surface to-nex-deep'
            : 'border-nex-light bg-nex-surface'
        )}>
          {/* Header - h2 for proper hierarchy (page h1 → release h2) */}
          <h2 className={cn(
            'text-xl font-bold',
            entry.isMajor ? 'text-gold' : 'text-slate-light'
          )}>
            {entry.title}
          </h2>
          <p className="mt-2 text-slate-dim">
            {entry.description}
          </p>

          {/* Changes Sections */}
          {hasChanges && (
            <div className="mt-8 space-y-8">
              <ChangesSection type="feature" items={[...entry.changes.features]} sectionId={generateSectionId(entry.version, 'feature')} defaultOpen={entry.isMajor} />
              <ChangesSection type="improvement" items={[...entry.changes.improvements]} sectionId={generateSectionId(entry.version, 'improvement')} />
              <ChangesSection type="fix" items={[...entry.changes.fixes]} sectionId={generateSectionId(entry.version, 'fix')} />
              <ChangesSection type="security" items={[...entry.changes.security]} sectionId={generateSectionId(entry.version, 'security')} />
              <ChangesSection type="accessibility" items={[...entry.changes.accessibility]} sectionId={generateSectionId(entry.version, 'accessibility')} />
              <ChangesSection type="breaking" items={[...entry.changes.breaking]} sectionId={generateSectionId(entry.version, 'breaking')} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
