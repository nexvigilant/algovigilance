/**
 * Calculator Activity Engine Types
 * Quantitative reasoning for signal detection and statistical analysis
 */

// ============================================================================
// CALCULATOR ENGINE
// ============================================================================

/**
 * Calculator Activity Engine
 * Quantitative exercises for PV statistics and calculations
 */
export interface CalculatorConfig {
  scenario: string;                    // Context for the calculation
  dataTable: CalculatorDataTable;      // Input data (typically 2x2 or multi-row)
  calculations: CalculatorTask[];      // What to compute
  showFormulas: boolean;               // Display formula hints
  tolerance: number;                   // Acceptable error margin (e.g., 0.01 for 1%)
  timeLimitSeconds?: number;           // Optional time pressure
  calculatorAllowed: boolean;          // Allow built-in calculator tool
}

/**
 * Data table for calculations
 * Supports 2x2 contingency tables and multi-row data
 */
export interface CalculatorDataTable {
  type: '2x2' | 'multi_row' | 'single_value';
  title?: string;

  // For 2x2 contingency tables (PRR, ROR calculations)
  contingencyTable?: {
    headers: { row: string; col: string };
    cells: {
      a: number;  // Drug + Event
      b: number;  // Drug + No Event
      c: number;  // No Drug + Event
      d: number;  // No Drug + No Event
    };
    labels?: {
      a?: string;
      b?: string;
      c?: string;
      d?: string;
    };
  };

  // For multi-row data (rates, trends)
  rows?: CalculatorDataRow[];
  columns?: string[];

  // For single values
  values?: Record<string, number>;
}

export interface CalculatorDataRow {
  label: string;
  values: number[];
  highlight?: boolean;
}

/**
 * Individual calculation task
 */
export interface CalculatorTask {
  id: string;
  name: string;                        // Display name (e.g., "PRR", "95% CI Lower")
  description: string;                 // What to calculate
  formula?: string;                    // Optional formula display (LaTeX or plain)
  expectedAnswer: number;
  unit?: string;                       // e.g., "%", "per 1000", "ratio"
  decimalPlaces: number;               // Required precision
  partialCredit: boolean;              // Award points for close answers
  hints?: string[];                    // Progressive hints if stuck

  // Interpretation component
  interpretation?: {
    prompt: string;                    // "What does this PRR value suggest?"
    options: CalculatorInterpretationOption[];
    correctOptionId: string;
  };
}

export interface CalculatorInterpretationOption {
  id: string;
  label: string;
  explanation: string;
}

/**
 * Calculator engine result
 */
export interface CalculatorResult {
  totalScore: number;                  // 0-100
  totalTimeSpent: number;              // seconds
  calculations: CalculatorTaskResult[];
  interpretationsCorrect: number;
  interpretationsTotal: number;
}

export interface CalculatorTaskResult {
  taskId: string;
  userAnswer: number | null;
  expectedAnswer: number;
  isCorrect: boolean;
  isWithinTolerance: boolean;
  percentageError: number;
  timeSpent: number;
  hintsUsed: number;
  interpretationCorrect?: boolean;
}

// ============================================================================
// COMMON CALCULATION TYPES
// ============================================================================

/**
 * Pre-defined calculation types for quick configuration
 */
export type CalculationType =
  | 'prr'                              // Proportional Reporting Ratio
  | 'ror'                              // Reporting Odds Ratio
  | 'prr_ci_lower'                     // PRR 95% CI Lower Bound
  | 'prr_ci_upper'                     // PRR 95% CI Upper Bound
  | 'ror_ci_lower'                     // ROR 95% CI Lower Bound
  | 'ror_ci_upper'                     // ROR 95% CI Upper Bound
  | 'ic'                               // Information Component (Bayesian)
  | 'ebgm'                             // Empirical Bayes Geometric Mean
  | 'reporting_rate'                   // Cases per population
  | 'incidence_rate'                   // New cases per time period
  | 'relative_risk'                    // RR
  | 'chi_square'                       // Chi-square statistic
  | 'custom';                          // User-defined

/**
 * Formula reference for common calculations
 */
export const CALCULATION_FORMULAS: Record<CalculationType, string> = {
  prr: 'PRR = (a/(a+b)) / (c/(c+d))',
  ror: 'ROR = (a/b) / (c/d) = (a*d) / (b*c)',
  prr_ci_lower: 'PRR_lower = PRR * exp(-1.96 * sqrt(1/a - 1/(a+b) + 1/c - 1/(c+d)))',
  prr_ci_upper: 'PRR_upper = PRR * exp(+1.96 * sqrt(1/a - 1/(a+b) + 1/c - 1/(c+d)))',
  ror_ci_lower: 'ROR_lower = ROR * exp(-1.96 * sqrt(1/a + 1/b + 1/c + 1/d))',
  ror_ci_upper: 'ROR_upper = ROR * exp(+1.96 * sqrt(1/a + 1/b + 1/c + 1/d))',
  ic: 'IC = log2(observed / expected)',
  ebgm: 'EBGM = geometric mean of posterior distribution',
  reporting_rate: 'Rate = (cases / population) * multiplier',
  incidence_rate: 'IR = new_cases / person_time',
  relative_risk: 'RR = (a/(a+b)) / (c/(c+d))',
  chi_square: 'X² = Σ((O-E)²/E)',
  custom: '',
};

/**
 * Signal threshold reference values
 */
export const SIGNAL_THRESHOLDS = {
  prr: { signal: 2.0, strongSignal: 3.0 },
  ror: { signal: 2.0, strongSignal: 3.0 },
  prr_ci_lower: { signal: 1.0 },        // CI lower > 1 = significant
  ror_ci_lower: { signal: 1.0 },
  ic: { signal: 0.0, strongSignal: 2.0 },
  ebgm: { signal: 2.0, strongSignal: 3.0 },
  chi_square: { signal: 3.84 },         // p < 0.05 threshold
} as const;
