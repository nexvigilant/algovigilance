/**
 * Timeline Activity Engine Types
 * Temporal reasoning for reporting deadlines and chronology
 */

// ============================================================================
// TIMELINE ENGINE
// ============================================================================

/**
 * Timeline Activity Engine
 * Temporal reasoning for regulatory deadlines and event sequencing
 */
export interface TimelineConfig {
  scenario: string;                    // Case context
  events: TimelineEvent[];             // Events to work with
  tasks: TimelineTask[];               // What to determine
  regulations: RegulationReference[];  // Applicable rules
  showCalendar: boolean;               // Display calendar UI
  allowReordering: boolean;            // User can drag events
  timeLimitSeconds?: number;           // Optional time pressure
}

/**
 * Event in the timeline
 */
export interface TimelineEvent {
  id: string;
  title: string;                       // Display title for the event
  description: string;
  date: string;                        // ISO date string
  isDateKnown?: boolean;               // Whether date is provided or must be calculated
  type: TimelineEventType;
  source?: string;                     // Where this info came from
  highlight?: boolean;                 // Visual emphasis
  isDay0?: boolean;                    // Whether this is the Day 0 event
  metadata?: Record<string, unknown>;  // Additional event data
}

export type TimelineEventType =
  | 'awareness'                        // Company becomes aware
  | 'receipt'                          // Case received
  | 'onset'                            // Adverse event onset
  | 'resolution'                       // Event resolved
  | 'death'                            // Fatal outcome
  | 'hospitalization'                  // Hospital admission
  | 'submission'                       // Report submitted
  | 'clock_stop'                       // Clock pause event
  | 'clock_restart'                    // Clock resume
  | 'follow_up_sent'                   // Follow-up request
  | 'follow_up_received'               // Follow-up response
  | 'assessment'                       // Medical assessment
  | 'database_entry'                   // Case entered in DB
  | 'other';

/**
 * Task to complete in the timeline exercise
 */
export interface TimelineTask {
  id: string;
  taskType: TimelineTaskType;
  question: string;
  instructions?: string;
  difficulty?: 'foundational' | 'intermediate' | 'advanced';

  // For ordering tasks
  eventIds?: string[];                 // Event IDs involved in this task
  correctOrder?: string[];             // Event IDs in correct sequence
  correctAnswer?: string | string[];   // For validation

  // For date calculation tasks
  expectedDate?: string;               // ISO date
  relativeToEvent?: string;            // Event ID this is relative to
  dayOffset?: number;                  // Days from reference event
  toleranceDays?: number;              // Acceptable tolerance in days

  // For interval tasks
  expectedInterval?: number;           // Days
  intervalUnit?: 'days' | 'hours' | 'calendar_days' | 'business_days';

  // For Day 0 determination
  day0EventId?: string;                // Which event is Day 0
  day0Rationale?: string;              // Why this is Day 0

  // For deadline tasks
  deadlineType?: DeadlineType;
  deadlineDate?: string;
  isExpedited?: boolean;

  // Scoring and hints
  points: number;
  partialCredit: boolean;
  hint?: string;
  explanation?: string;
}

export type TimelineTaskType =
  | 'order_events'                     // Arrange events chronologically
  | 'identify_day0'                    // Determine awareness date
  | 'calculate_deadline'               // When is report due
  | 'calculate_interval'               // How many days between events
  | 'identify_clock_stop'              // Find clock-stopping events
  | 'determine_expedited'              // Is expedited reporting required
  | 'classify_case'                    // Serious/non-serious, expected/unexpected
  | 'custom';

export type DeadlineType =
  | 'expedited_fatal'                  // 7 calendar days (IND) or 15 days
  | 'expedited_serious'                // 15 calendar days
  | 'expedited_15day'                  // 15 calendar days (general)
  | 'periodic'                         // PSUR/PBRER cycle
  | 'follow_up'                        // Follow-up submission
  | 'annual'                           // Annual report
  | 'custom';

/**
 * Regulatory reference for deadline rules
 */
export interface RegulationReference {
  id: string;
  name: string;                        // "21 CFR 312.32", "ICH E2D"
  source: string;                      // Organization/document source
  jurisdiction: 'fda' | 'ema' | 'pmda' | 'nmpa' | 'ich' | 'other';
  summary: string;                     // Brief description
  requirement: string;                 // Detailed requirement text
  deadlineDays?: number;               // Days for deadline
  region?: string;                     // Geographic region
  url?: string;                        // Link to source
  deadlineRules?: DeadlineRule[];
}

export interface DeadlineRule {
  condition: string;                   // When this rule applies
  deadline: number;                    // Days
  unit: 'calendar_days' | 'business_days';
  startFrom: 'awareness' | 'receipt' | 'database_entry';
  exceptions?: string[];               // Clock-stop conditions
}

/**
 * Timeline engine result
 */
export interface TimelineResult {
  score: number;                       // 0-100
  totalTasks: number;
  correctAnswers: number;
  taskResults: TimelineTaskResult[];
  timeSpentSeconds: number;            // seconds
  eventsOrdered?: boolean;             // If ordering was a task
  deadlinesCorrect?: number;
  deadlinesTotal?: number;
  completedAt: Date;
}

export interface TimelineTaskResult {
  taskId: string;
  isCorrect: boolean;
  userAnswer?: string | string[];
  correctAnswer: string | string[];
}

// ============================================================================
// REGULATORY DEADLINE CONSTANTS
// ============================================================================

/**
 * Common expedited reporting timelines by jurisdiction
 */
export const EXPEDITED_DEADLINES = {
  fda_ind_fatal: {
    days: 7,
    unit: 'calendar_days' as const,
    description: 'IND Safety Report - Fatal/Life-threatening',
  },
  fda_ind_serious: {
    days: 15,
    unit: 'calendar_days' as const,
    description: 'IND Safety Report - Serious, Unexpected',
  },
  fda_nda_serious: {
    days: 15,
    unit: 'calendar_days' as const,
    description: 'NDA/BLA 15-Day Report',
  },
  ema_susar_fatal: {
    days: 7,
    unit: 'calendar_days' as const,
    description: 'SUSAR - Fatal/Life-threatening',
  },
  ema_susar_other: {
    days: 15,
    unit: 'calendar_days' as const,
    description: 'SUSAR - Other Serious',
  },
  ich_e2d_serious: {
    days: 15,
    unit: 'calendar_days' as const,
    description: 'ICH E2D Expedited Report',
  },
} as const;

/**
 * Day 0 determination rules
 */
export const DAY0_RULES = {
  clinical_trial: 'Date investigator or sponsor becomes aware of case',
  spontaneous: 'Date company first receives minimum information',
  literature: 'Date publication is identified as containing reportable case',
  regulatory: 'Date of receipt from regulatory authority',
  partner: 'Date of receipt from partner company (per agreement)',
} as const;

/**
 * Clock-stop conditions
 */
export const CLOCK_STOP_CONDITIONS = [
  'Insufficient minimum criteria (missing 4 elements)',
  'Follow-up request sent, awaiting response',
  'Information received, assessment in progress (max 3 days)',
  'Regulatory authority requested hold',
] as const;
