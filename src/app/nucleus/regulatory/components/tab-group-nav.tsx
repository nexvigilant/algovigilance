'use client'

import type { LucideIcon } from 'lucide-react'
import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabGroup } from '@/lib/regulatory/types'

interface TabGroupNavProps {
  tabGroups: TabGroup[]
  activeGroupId: string
  onGroupChange: (groupId: string) => void
}

function resolveIcon(name: string): LucideIcon {
  const icons = Icons as Record<string, unknown>
  const candidate = icons[name]
  if (typeof candidate === 'function' && 'displayName' in candidate) {
    return candidate as LucideIcon
  }
  return Icons.FileText
}

export function TabGroupNav({ tabGroups, activeGroupId, onGroupChange }: TabGroupNavProps) {
  if (tabGroups.length === 0) return null

  return (
    <nav
      className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1"
      role="tablist"
      aria-label="Regulatory market categories"
    >
      {tabGroups.map((group) => {
        const Icon = resolveIcon(group.icon)
        const isActive = group.id === activeGroupId

        return (
          <button
            key={group.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onGroupChange(group.id)}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-cyan-400')} />
            <span>{group.label}</span>
            {group.tabs.length > 0 && (
              <span
                className={cn(
                  'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-mono',
                  isActive
                    ? 'bg-cyan-400/15 text-cyan-400'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {group.tabs.length}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
