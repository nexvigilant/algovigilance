'use client'

import { cn } from '@/lib/utils'
import type { Tab } from '@/lib/regulatory/types'

interface TabNavProps {
  tabs: Tab[]
  activeTabId: string
  onTabChange: (tabId: string) => void
}

export function TabNav({ tabs, activeTabId, onTabChange }: TabNavProps) {
  if (tabs.length === 0) return null

  return (
    <div
      className="flex flex-wrap gap-0.5 border-b border-border"
      role="tablist"
      aria-label="Data type tabs"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative px-4 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              isActive
                ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-400 after:content-[""]'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
