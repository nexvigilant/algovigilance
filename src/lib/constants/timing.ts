/**
 * Timing and Duration Constants (in milliseconds)
 */

export const TIMING = {
  // UI Interactions
  defaultDebounce: 300,
  searchDebounce: 500,
  autosaveDelay: 1000,
  toastDuration: 5000,
  
  // Refresh Intervals
  sidebarRefresh: 30000,
  unreadCountsRefresh: 60000,
  dashboardStatsRefresh: 300000, // 5 minutes
  
  // API & Retries
  apiTimeout: 15000,
  retryBaseDelay: 2000,
  
  // Animation Durations
  modalTransition: 200,
  hoverTransition: 150,
};

/**
 * Time unit conversion anchors.
 */
export const TIME_UNITS = {
  msPerSecond: 1000,
  secondsPerMinute: 60,
  minutesPerHour: 60,
  hoursPerDay: 24,
  daysPerWeek: 7,
  daysPerThirtyDayMonth: 30,
} as const;

/**
 * Canonical duration values in milliseconds.
 */
export const DURATION_MS = {
  minute: TIME_UNITS.msPerSecond * TIME_UNITS.secondsPerMinute,
  hour: TIME_UNITS.msPerSecond * TIME_UNITS.secondsPerMinute * TIME_UNITS.minutesPerHour,
  day:
    TIME_UNITS.msPerSecond *
    TIME_UNITS.secondsPerMinute *
    TIME_UNITS.minutesPerHour *
    TIME_UNITS.hoursPerDay,
  week:
    TIME_UNITS.msPerSecond *
    TIME_UNITS.secondsPerMinute *
    TIME_UNITS.minutesPerHour *
    TIME_UNITS.hoursPerDay *
    TIME_UNITS.daysPerWeek,
  thirtyDays:
    TIME_UNITS.msPerSecond *
    TIME_UNITS.secondsPerMinute *
    TIME_UNITS.minutesPerHour *
    TIME_UNITS.hoursPerDay *
    TIME_UNITS.daysPerThirtyDayMonth,
} as const;

/**
 * Standard moderation dashboard time range windows.
 */
export const MODERATION_TIME_RANGES_MS = {
  '24h': DURATION_MS.day,
  '7d': DURATION_MS.week,
  '30d': DURATION_MS.thirtyDays,
} as const;

export function hoursToMs(hours: number): number {
  return hours * DURATION_MS.hour;
}

export function daysToMs(days: number): number {
  return days * DURATION_MS.day;
}
