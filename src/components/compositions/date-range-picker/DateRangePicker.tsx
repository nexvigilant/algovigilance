'use client';

/**
 * DateRangePicker starter composition.
 * Requires `react-day-picker` to be installed.
 *
 * If you see an error about missing dependency, install it:
 *   npm install react-day-picker
 */

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { logger } from '@/lib/logger';
const log = logger.scope('components/DateRangePicker');

let DayPicker: typeof import('react-day-picker').DayPicker | null = null;
try {
  // Lazy require to avoid crashing when dependency is not installed
  DayPicker = require('react-day-picker').DayPicker;
} catch {
  log.warn('[DateRangePicker] react-day-picker not installed. Install with `npm install react-day-picker`.');
}

export interface DateRangePickerProps {
  onRangeSelect?: (range: DateRange | undefined) => void;
  maxRange?: number;
  minDate?: Date;
  maxDate?: Date;
}

export function DateRangePicker({
  onRangeSelect,
  maxRange = 90,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const [range, setRange] = useState<DateRange | undefined>({ from: undefined, to: undefined });

  if (!DayPicker) {
    return (
      <div className="border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3 rounded">
        react-day-picker is not installed. Run: npm install react-day-picker
      </div>
    );
  }

  const handleSelect = (nextRange: DateRange | undefined) => {
    if (nextRange?.from && nextRange?.to) {
      const days = Math.abs((nextRange.to.getTime() - nextRange.from.getTime()) / (1000 * 60 * 60 * 24));
      if (days > maxRange) {
        return; // reject over-long ranges
      }
    }

    setRange(nextRange);
    onRangeSelect?.(nextRange);
  };

  return (
    <DayPicker
      mode="range"
      selected={range}
      onSelect={handleSelect}
      disabled={[
        minDate ? { before: minDate } : undefined,
        maxDate ? { after: maxDate } : undefined,
      ].filter(Boolean) as any}
    />
  );
}
