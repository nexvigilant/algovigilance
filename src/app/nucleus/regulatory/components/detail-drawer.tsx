'use client'

import { X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import type { Tab } from '@/lib/regulatory/types'

interface DetailDrawerProps {
  open: boolean
  onClose: () => void
  record: Record<string, unknown> | null
  tab: Tab
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function renderDetailValue(value: unknown, depth = 0): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground text-sm">—</span>
  }

  if (typeof value === 'boolean') {
    return (
      <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
        {value ? 'Yes' : 'No'}
      </Badge>
    )
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const str = String(value)
    if (!str) return <span className="text-muted-foreground text-sm">—</span>
    // Detect YYYYMMDD date format
    if (/^\d{8}$/.test(str)) {
      return (
        <span className="text-sm tabular-nums">
          {`${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`}
        </span>
      )
    }
    // Detect URL
    if (str.startsWith('http://') || str.startsWith('https://')) {
      return (
        <a
          href={str}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-cyan-400 hover:underline break-all"
        >
          {str}
        </a>
      )
    }
    return <span className="text-sm break-words">{str}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground text-sm">Empty list</span>
    }
    return (
      <ul className="space-y-1">
        {value.map((item, i) => (
          <li key={i} className={depth > 0 ? 'border-l border-border pl-3' : ''}>
            {renderDetailValue(item, depth + 1)}
          </li>
        ))}
      </ul>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) {
      return <span className="text-muted-foreground text-sm">—</span>
    }
    return (
      <div className={depth > 0 ? 'space-y-2 border-l border-border pl-3' : 'space-y-2'}>
        {entries.map(([k, v]) => (
          <div key={k}>
            <span className="text-xs font-mono text-muted-foreground">{formatLabel(k)}: </span>
            {renderDetailValue(v, depth + 1)}
          </div>
        ))}
      </div>
    )
  }

  return <span className="text-sm">{String(value)}</span>
}

export function DetailDrawer({ open, onClose, record, tab }: DetailDrawerProps) {
  const title = record
    ? String(record[tab.titleField] ?? 'Detail View')
    : 'Detail View'

  const subtitle = record && tab.dateField
    ? String(record[tab.dateField] ?? '')
    : ''

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col gap-0 p-0"
      >
        <SheetHeader className="border-b border-border px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base leading-tight">{title}</SheetTitle>
              {subtitle && (
                <SheetDescription className="mt-1 text-xs">
                  {subtitle}
                </SheetDescription>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-sm opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {record ? (
            <div className="space-y-4 px-6 py-4">
              {Object.entries(record).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="text-xs font-medium text-muted-foreground pt-0.5 break-words">
                    {formatLabel(key)}
                  </span>
                  <div className="min-w-0">
                    {renderDetailValue(value)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              No record selected
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
