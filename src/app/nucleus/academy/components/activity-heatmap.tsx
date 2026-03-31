'use client';

import { cn } from '@/lib/utils';
import type { DailyReviewActivity } from '@/lib/actions/fsrs';

interface ActivityHeatmapProps {
  history: DailyReviewActivity[];
  className?: string;
}

/**
 * GitHub-style activity heatmap for review history.
 * Shows last 12 weeks of review activity as a grid of colored cells.
 */
export function ActivityHeatmap({ history, className }: ActivityHeatmapProps) {
  // Build a lookup map from date string to review count
  const reviewMap = new Map<string, number>();
  for (const day of history) {
    reviewMap.set(day.date, day.reviewCount);
  }

  // Generate last 84 days (12 weeks)
  const days: { date: string; count: number; dayOfWeek: number }[] = [];
  const today = new Date();

  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      count: reviewMap.get(dateStr) ?? 0,
      dayOfWeek: d.getDay(),
    });
  }

  // Group into weeks (columns)
  const weeks: typeof days[] = [];
  let currentWeek: typeof days = [];

  for (const day of days) {
    if (day.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const totalReviews = history.reduce((sum, d) => sum + d.reviewCount, 0);
  const activeDays = history.filter(d => d.reviewCount > 0).length;

  return (
    <div className={cn('bg-nex-dark/80 border border-nex-light/30 rounded-2xl p-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label="calendar">📅</span>
          <h3 className="text-sm font-semibold text-slate-light tracking-wide">
            Review Activity
          </h3>
        </div>
        <span className="text-xs text-slate-dim">
          {totalReviews} reviews across {activeDays} days
        </span>
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-[3px] justify-center overflow-x-auto">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {/* Pad the first week if it doesn't start on Sunday */}
            {wi === 0 && week[0].dayOfWeek > 0 && (
              Array.from({ length: week[0].dayOfWeek }).map((_, pi) => (
                <div key={`pad-${pi}`} className="h-3 w-3" />
              ))
            )}
            {week.map(day => (
              <div
                key={day.date}
                className={cn(
                  'h-3 w-3 rounded-sm transition-colors',
                  getHeatmapColor(day.count)
                )}
                title={`${day.date}: ${day.count} reviews`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-3">
        <span className="text-[10px] text-slate-dim mr-1">Less</span>
        <div className="h-3 w-3 rounded-sm bg-nex-light/10" />
        <div className="h-3 w-3 rounded-sm bg-cyan/20" />
        <div className="h-3 w-3 rounded-sm bg-cyan/40" />
        <div className="h-3 w-3 rounded-sm bg-cyan/70" />
        <div className="h-3 w-3 rounded-sm bg-cyan" />
        <span className="text-[10px] text-slate-dim ml-1">More</span>
      </div>
    </div>
  );
}

function getHeatmapColor(count: number): string {
  if (count === 0) return 'bg-nex-light/10';
  if (count <= 2) return 'bg-cyan/20';
  if (count <= 5) return 'bg-cyan/40';
  if (count <= 10) return 'bg-cyan/70';
  return 'bg-cyan';
}
