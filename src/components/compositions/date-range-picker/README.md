# DateRangePicker Composition

**Status**: Ready for Implementation

Date range selection component with calendar interface.

## Recommended Library

**react-day-picker** - Already installed in project

```tsx
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

export function DateRangePicker({
  onRangeSelect,
  maxRange = 90,
  minDate,
  maxDate,
}) {
  const [range, setRange] = useState({ from: undefined, to: undefined });

  const handleSelect = (range) => {
    // Validate range doesn't exceed maxRange
    if (range?.from && range?.to) {
      const days = Math.abs((range.to - range.from) / (1000 * 60 * 60 * 24));
      if (days > maxRange) {
        return; // Reject if too long
      }
    }

    setRange(range);
    onRangeSelect?.(range);
  };

  return (
    <DayPicker
      mode="range"
      selected={range}
      onSelect={handleSelect}
      disabled={[
        { before: minDate },
        { after: maxDate },
      ]}
    />
  );
}
```

## Quick Start

```tsx
<DateRangePicker
  onRangeSelect={({ from, to }) => {
    console.log('Range:', from, to);
    fetchDataForRange(from, to);
  }}
  maxRange={30} // Max 30 days
  minDate={new Date(2023, 0, 1)}
  maxDate={new Date()}
/>
```

## Features

- Calendar-based selection
- Max range validation
- Min/max date bounds
- Preset ranges (today, last 7 days, last 30 days, etc.)
- Keyboard navigation
- Accessibility compliant

## Preset Ranges

```tsx
const PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];
```
