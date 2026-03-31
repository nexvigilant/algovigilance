'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { FilterDef } from '@/lib/regulatory/types'

interface FilterBarProps {
  filters: FilterDef[]
  activeFilters: Record<string, unknown>
  onChange: (filters: Record<string, unknown>) => void
}

export function FilterBar({ filters, activeFilters, onChange }: FilterBarProps) {
  if (filters.length === 0) return null

  function handleChange(queryField: string, value: unknown) {
    onChange({ ...activeFilters, [queryField]: value })
  }

  function handleReset() {
    onChange({})
  }

  const hasActiveFilters = Object.values(activeFilters).some(
    (v) => v !== '' && v !== undefined && v !== null && v !== false,
  )

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-muted/20 px-4 py-3">
      {filters.map((filter) => {
        const currentValue = activeFilters[filter.queryField]

        switch (filter.type) {
          case 'select':
            return (
              <div key={filter.id} className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">{filter.label}</Label>
                <Select
                  value={typeof currentValue === 'string' ? currentValue : ''}
                  onValueChange={(v) => handleChange(filter.queryField, v === '__all__' ? '' : v)}
                >
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue placeholder={`All ${filter.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All</SelectItem>
                    {filter.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )

          case 'text':
            return (
              <div key={filter.id} className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">{filter.label}</Label>
                <Input
                  placeholder={filter.label}
                  value={typeof currentValue === 'string' ? currentValue : ''}
                  onChange={(e) => handleChange(filter.queryField, e.target.value)}
                  className="h-8 w-40 text-xs"
                />
              </div>
            )

          case 'date-range':
            return (
              <div key={filter.id} className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">{filter.label}</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="date"
                    value={
                      typeof currentValue === 'object' &&
                      currentValue !== null &&
                      'from' in currentValue
                        ? String((currentValue as { from: unknown }).from)
                        : ''
                    }
                    onChange={(e) =>
                      handleChange(filter.queryField, {
                        ...(typeof currentValue === 'object' && currentValue !== null
                          ? (currentValue as Record<string, unknown>)
                          : {}),
                        from: e.target.value,
                      })
                    }
                    className="h-8 w-36 text-xs"
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="date"
                    value={
                      typeof currentValue === 'object' &&
                      currentValue !== null &&
                      'to' in currentValue
                        ? String((currentValue as { to: unknown }).to)
                        : ''
                    }
                    onChange={(e) =>
                      handleChange(filter.queryField, {
                        ...(typeof currentValue === 'object' && currentValue !== null
                          ? (currentValue as Record<string, unknown>)
                          : {}),
                        to: e.target.value,
                      })
                    }
                    className="h-8 w-36 text-xs"
                  />
                </div>
              </div>
            )

          case 'toggle':
            return (
              <div key={filter.id} className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">{filter.label}</Label>
                <div className="flex h-8 items-center">
                  <Switch
                    checked={currentValue === true || currentValue === 'true'}
                    onCheckedChange={(checked) => handleChange(filter.queryField, checked)}
                  />
                </div>
              </div>
            )

          default:
            return null
        }
      })}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Reset
        </Button>
      )}
    </div>
  )
}
