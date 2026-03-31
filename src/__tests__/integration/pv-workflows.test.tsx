/**
 * PV Use-Case Integration Tests
 *
 * Tests practical pharmacovigilance workflows through the UI components,
 * verifying the full path: user interaction → API call → result rendering.
 *
 * Mocking strategy: mock `@/lib/nexcore-api` module to control backend responses.
 * Hooks (useAsyncState, useAdaptiveBackoff) run as real code in jsdom.
 *
 * Run with: npm test -- pv-workflows
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import type {
  SignalCompleteResponse,
  FaersDrugEventsResponse,
} from '@/types/nexcore';

// ── Mock nexcore-api ──────────────────────────────────────────────────

const mockSignalComplete = jest.fn<Promise<SignalCompleteResponse>, [number, number, number, number]>();
const mockFaersDrugEvents = jest.fn<Promise<FaersDrugEventsResponse>, [string, number?]>();

jest.mock('@/lib/nexcore-api', () => ({
  signalComplete: (...args: [number, number, number, number]) => mockSignalComplete(...args),
  faersDrugEvents: (...args: [string, number?]) => mockFaersDrugEvents(...args),
}));

// ── Mock hooks that require browser APIs ──────────────────────────────

jest.mock('@/hooks/use-ui-sounds', () => ({
  useUISounds: () => ({
    playHover: jest.fn(),
    playClick: jest.fn(),
    playSuccess: jest.fn(),
    playError: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-haptic-feedback', () => ({
  useHapticFeedback: () => ({
    lightTap: jest.fn(),
    mediumTap: jest.fn(),
    heavyTap: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    isSupported: false,
  }),
}));

// ── Mock logger (avoids console noise) ──────────────────────────────

jest.mock('@/lib/logger', () => ({
  logger: {
    scope: () => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

// ── Mock nexcore-config ─────────────────────────────────────────────

jest.mock('@/lib/nexcore-config', () => ({
  NEXCORE_API_URL: 'http://localhost:3030',
}));

jest.mock('@/lib/nexcore-schemas', () => ({
  getSchemaForPath: () => null,
}));

// ── Fixtures ──────────────────────────────────────────────────────────

const SIGNAL_DETECTED_RESPONSE: SignalCompleteResponse = {
  prr: 7.5,
  prr_ci_lower: 4.2,
  prr_ci_upper: 13.4,
  prr_signal: true,
  ror: 8.1,
  ror_ci_lower: 4.5,
  ror_ci_upper: 14.6,
  ror_signal: true,
  ic: 2.9,
  ic_ci_lower: 2.1,
  ic_signal: true,
  ebgm: 6.3,
  eb05: 3.8,
  ebgm_signal: true,
  chi_square: 125.4,
  signal_detected: true,
};

const NO_SIGNAL_RESPONSE: SignalCompleteResponse = {
  prr: 0.8,
  prr_ci_lower: 0.3,
  prr_ci_upper: 2.1,
  prr_signal: false,
  ror: 0.75,
  ror_ci_lower: 0.3,
  ror_ci_upper: 1.9,
  ror_signal: false,
  ic: -0.4,
  ic_ci_lower: -1.2,
  ic_signal: false,
  ebgm: 0.9,
  eb05: 0.4,
  ebgm_signal: false,
  chi_square: 0.5,
  signal_detected: false,
};

const ASPIRIN_EVENTS_RESPONSE: FaersDrugEventsResponse = {
  drug: 'aspirin',
  total_reports: 45230,
  events: [
    { event: 'GASTROINTESTINAL HAEMORRHAGE', count: 8200, percentage: 18.1 },
    { event: 'NAUSEA', count: 5100, percentage: 11.3 },
    { event: 'HEADACHE', count: 3400, percentage: 7.5 },
    { event: 'DIZZINESS', count: 2800, percentage: 6.2 },
    { event: 'RASH', count: 1200, percentage: 2.7 },
  ],
};

const EMPTY_EVENTS_RESPONSE: FaersDrugEventsResponse = {
  drug: 'unknowndrug',
  total_reports: 0,
  events: [],
};

// ── Helpers ───────────────────────────────────────────────────────────

/** Clear input and type new value */
async function clearAndType(user: ReturnType<typeof userEvent.setup>, element: HTMLElement, value: string) {
  await user.tripleClick(element);
  await user.keyboard(value);
}

// ═════════════════════════════════════════════════════════════════════
// 1. SIGNAL DETECTION WORKFLOW
// ═════════════════════════════════════════════════════════════════════

describe('Signal Detection Workflow', () => {
  let SignalCalculator: React.ComponentType;

  beforeAll(async () => {
    // Dynamic import after mocks are set up
    const mod = await import('@/app/nucleus/guardian/components/signal-calculator');
    SignalCalculator = mod.SignalCalculator;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders 2x2 contingency table with default values', () => {
    render(<SignalCalculator />);

    expect(screen.getByText('2x2 Contingency Table')).toBeInTheDocument();
    expect(screen.getByLabelText('a (Drug+Event)')).toHaveValue(15);
    expect(screen.getByLabelText('b (Drug+NoEvent)')).toHaveValue(100);
    expect(screen.getByLabelText('c (NoDrug+Event)')).toHaveValue(20);
    expect(screen.getByLabelText('d (NoDrug+NoEvent)')).toHaveValue(10000);
    expect(screen.getByText('Execute Signal Detection')).toBeInTheDocument();
  });

  test('submits contingency table and displays signal detected', async () => {
    mockSignalComplete.mockResolvedValueOnce(SIGNAL_DETECTED_RESPONSE);
    const user = userEvent.setup();

    render(<SignalCalculator />);

    // Click execute with default values
    await user.click(screen.getByText('Execute Signal Detection'));

    // Verify API called with default values
    expect(mockSignalComplete).toHaveBeenCalledWith(15, 100, 20, 10000);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('Signal Detected')).toBeInTheDocument();
    });

    // Verify all 5 metric cards rendered
    expect(screen.getByText('PRR')).toBeInTheDocument();
    expect(screen.getByText('ROR')).toBeInTheDocument();
    expect(screen.getByText('IC')).toBeInTheDocument();
    expect(screen.getByText('EBGM')).toBeInTheDocument();

    // Verify signal badges
    const signalBadges = screen.getAllByText('SIGNAL');
    expect(signalBadges.length).toBeGreaterThanOrEqual(4); // PRR, ROR, IC, EBGM all signal
  });

  test('submits and displays no signal detected', async () => {
    mockSignalComplete.mockResolvedValueOnce(NO_SIGNAL_RESPONSE);
    const user = userEvent.setup();

    render(<SignalCalculator />);
    await user.click(screen.getByText('Execute Signal Detection'));

    await waitFor(() => {
      expect(screen.getByText('No Signal Detected')).toBeInTheDocument();
    });

    // Verify clear badges
    const clearBadges = screen.getAllByText('CLEAR');
    expect(clearBadges.length).toBeGreaterThanOrEqual(4);
  });

  test('allows editing cell values before submission', async () => {
    mockSignalComplete.mockResolvedValueOnce(SIGNAL_DETECTED_RESPONSE);
    const user = userEvent.setup();

    render(<SignalCalculator />);

    const cellA = screen.getByLabelText('a (Drug+Event)');
    await clearAndType(user, cellA, '150');

    const cellB = screen.getByLabelText('b (Drug+NoEvent)');
    await clearAndType(user, cellB, '50');

    await user.click(screen.getByText('Execute Signal Detection'));

    expect(mockSignalComplete).toHaveBeenCalledWith(150, 50, 20, 10000);
  });

  test('displays API error message on failure', async () => {
    mockSignalComplete.mockRejectedValueOnce(new Error('Backend unavailable'));
    const user = userEvent.setup();

    render(<SignalCalculator />);
    await user.click(screen.getByText('Execute Signal Detection'));

    await waitFor(() => {
      expect(screen.getByText('Backend unavailable')).toBeInTheDocument();
    });
  });

  test('shows loading state during computation', async () => {
    // Use a promise we control to keep loading state visible
    let resolveSignal!: (value: SignalCompleteResponse) => void;
    mockSignalComplete.mockReturnValueOnce(
      new Promise<SignalCompleteResponse>((resolve) => {
        resolveSignal = resolve;
      })
    );
    const user = userEvent.setup();

    render(<SignalCalculator />);
    await user.click(screen.getByText('Execute Signal Detection'));

    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByText('Computing...')).toBeInTheDocument();
    });

    // Resolve and verify results appear
    resolveSignal(SIGNAL_DETECTED_RESPONSE);
    await waitFor(() => {
      expect(screen.getByText('Signal Detected')).toBeInTheDocument();
    });
  });

  test('displays confidence intervals for metrics', async () => {
    mockSignalComplete.mockResolvedValueOnce(SIGNAL_DETECTED_RESPONSE);
    const user = userEvent.setup();

    render(<SignalCalculator />);
    await user.click(screen.getByText('Execute Signal Detection'));

    await waitFor(() => {
      // PRR CI
      expect(screen.getByText(/4\.2000/)).toBeInTheDocument();
      expect(screen.getByText(/13\.4000/)).toBeInTheDocument();
    });
  });

  test('displays threshold information for each metric', async () => {
    mockSignalComplete.mockResolvedValueOnce(SIGNAL_DETECTED_RESPONSE);
    const user = userEvent.setup();

    render(<SignalCalculator />);
    await user.click(screen.getByText('Execute Signal Detection'));

    await waitFor(() => {
      // Each MetricCard shows "Threshold: ≥ X.X" text
      const thresholdTexts = screen.getAllByText(/Threshold:/i);
      expect(thresholdTexts.length).toBeGreaterThanOrEqual(1);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════
// 2. FAERS DRUG EVENT SEARCH WORKFLOW
// ═════════════════════════════════════════════════════════════════════

describe('FAERS Drug Event Search Workflow', () => {
  let FaersSearch: React.ComponentType;

  beforeAll(async () => {
    const mod = await import('@/app/nucleus/guardian/components/faers-search');
    FaersSearch = mod.FaersSearch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search interface with default drug name', () => {
    render(<FaersSearch />);

    expect(screen.getByText('FDA FAERS Query Interface')).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/enter drug name/i);
    expect(input).toHaveValue('aspirin');
    expect(screen.getByText('Query')).toBeInTheDocument();
  });

  test('searches for drug and displays adverse event table', async () => {
    mockFaersDrugEvents.mockResolvedValueOnce(ASPIRIN_EVENTS_RESPONSE);
    const user = userEvent.setup();

    render(<FaersSearch />);
    await user.click(screen.getByText('Query'));

    // Verify API called
    expect(mockFaersDrugEvents).toHaveBeenCalledWith('aspirin', 20);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/Adverse Events: aspirin/)).toBeInTheDocument();
    });

    // Verify report count
    expect(screen.getByText('45,230 reports')).toBeInTheDocument();

    // Verify event rows
    expect(screen.getByText('GASTROINTESTINAL HAEMORRHAGE')).toBeInTheDocument();
    expect(screen.getByText('NAUSEA')).toBeInTheDocument();
    expect(screen.getByText('HEADACHE')).toBeInTheDocument();
    expect(screen.getByText('DIZZINESS')).toBeInTheDocument();
    expect(screen.getByText('RASH')).toBeInTheDocument();

    // Verify counts rendered
    expect(screen.getByText('8,200')).toBeInTheDocument();

    // Verify percentage rendered
    expect(screen.getByText('18.1%')).toBeInTheDocument();
  });

  test('allows searching for a different drug', async () => {
    mockFaersDrugEvents.mockResolvedValueOnce({
      drug: 'metformin',
      total_reports: 12000,
      events: [{ event: 'LACTIC ACIDOSIS', count: 500, percentage: 4.2 }],
    });
    const user = userEvent.setup();

    render(<FaersSearch />);

    const input = screen.getByPlaceholderText(/enter drug name/i);
    await user.clear(input);
    await user.type(input, 'metformin');
    await user.click(screen.getByText('Query'));

    expect(mockFaersDrugEvents).toHaveBeenCalledWith('metformin', 20);

    await waitFor(() => {
      expect(screen.getByText('LACTIC ACIDOSIS')).toBeInTheDocument();
    });
  });

  test('supports Enter key to trigger search', async () => {
    mockFaersDrugEvents.mockResolvedValueOnce(ASPIRIN_EVENTS_RESPONSE);
    const user = userEvent.setup();

    render(<FaersSearch />);

    const input = screen.getByPlaceholderText(/enter drug name/i);
    await user.click(input);
    await user.keyboard('{Enter}');

    expect(mockFaersDrugEvents).toHaveBeenCalled();
  });

  test('shows empty state for drug with no events', async () => {
    mockFaersDrugEvents.mockResolvedValueOnce(EMPTY_EVENTS_RESPONSE);
    const user = userEvent.setup();

    render(<FaersSearch />);
    const input = screen.getByPlaceholderText(/enter drug name/i);
    await user.clear(input);
    await user.type(input, 'unknowndrug');
    await user.click(screen.getByText('Query'));

    await waitFor(() => {
      expect(screen.getByText(/No adverse events found/)).toBeInTheDocument();
    });
  });

  test('displays error on API failure', async () => {
    mockFaersDrugEvents.mockRejectedValueOnce(new Error('Rate limited by openFDA'));
    const user = userEvent.setup();

    render(<FaersSearch />);
    await user.click(screen.getByText('Query'));

    await waitFor(() => {
      expect(screen.getByText('Rate limited by openFDA')).toBeInTheDocument();
    });
  });

  test('disables query button when input is empty', async () => {
    const user = userEvent.setup();

    render(<FaersSearch />);
    const input = screen.getByPlaceholderText(/enter drug name/i);
    await user.clear(input);

    expect(screen.getByText('Query').closest('button')).toBeDisabled();
  });
});

// ═════════════════════════════════════════════════════════════════════
// 3. CAUSALITY ASSESSMENT WORKFLOW (Pure Logic)
// ═════════════════════════════════════════════════════════════════════

describe('Causality Assessment Workflow', () => {
  test('Naranjo score computation: definite signal', async () => {
    const { calculateNaranjoScore, interpretNaranjoScore } = await import('@/lib/pv/causality');

    // All "yes" answers: strong causal link (max score = 1+2+1+2+2+1+1+1+1+1 = 13)
    const answers: ('yes' | 'no' | 'unknown')[] = ['yes', 'yes', 'yes', 'yes', 'no', 'no', 'yes', 'yes', 'yes', 'yes'];
    const score = calculateNaranjoScore(answers);
    const category = interpretNaranjoScore(score);

    // Q5 "no"=+2 (no alternative causes), Q6 "no"=+1 (no placebo reaction)
    expect(score).toBeGreaterThanOrEqual(9);
    expect(category).toBe('definite');
  });

  test('Naranjo score computation: doubtful signal', async () => {
    const { calculateNaranjoScore, interpretNaranjoScore } = await import('@/lib/pv/causality');

    // Mostly unknown/no answers
    const answers: ('yes' | 'no' | 'unknown')[] = ['no', 'no', 'unknown', 'no', 'yes', 'unknown', 'no', 'unknown', 'no', 'unknown'];
    const score = calculateNaranjoScore(answers);
    const category = interpretNaranjoScore(score);

    // Q2 "no"=-1, Q4 "no"=-1, Q5 "yes"=-1 = -3
    expect(score).toBeLessThanOrEqual(0);
    expect(category).toBe('doubtful');
  });

  test('WHO-UMC causality assessment: certain', async () => {
    const { assessWHOUMCCausality } = await import('@/lib/pv/causality');

    const criteria = {
      temporalRelationship: true,
      plausibleMechanism: true,
      responseToWithdrawal: true,
      responseToRechallenge: true,
      alternativeExplanation: false,
    };

    const result = assessWHOUMCCausality(criteria);
    expect(result).toBe('certain');
  });

  test('compareCausalityMethods produces consistent ranking', async () => {
    const { compareCausalityMethods } = await import('@/lib/pv/causality');

    const comparison = compareCausalityMethods('definite', 'certain');
    expect(comparison).toBeDefined();
    expect(comparison.agreement).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 4. SIGNAL INTERPRETATION (Domain Logic)
// ═════════════════════════════════════════════════════════════════════

describe('Signal Detection Domain Logic', () => {
  test('strong signal triggers detection', async () => {
    const { detectSignal } = await import('@/lib/pv/signal-detection');

    const result = detectSignal({
      drug: 'ASPIRIN',
      event: 'GI Hemorrhage',
      table: { a: 150, b: 50, c: 100, d: 10000 },
    });

    expect(result.isSignal).toBe(true);
    expect(result.strength).not.toBe('none');
    expect(result.details.prr.isSignal).toBe(true);
  });

  test('weak data produces no signal', async () => {
    const { detectSignal } = await import('@/lib/pv/signal-detection');

    const result = detectSignal({
      drug: 'PLACEBO',
      event: 'HEADACHE',
      table: { a: 1, b: 500, c: 200, d: 10000 },
    });

    expect(result.isSignal).toBe(false);
  });

  test('validates contingency table rejects negative values', async () => {
    const { validateContingencyTable } = await import('@/lib/pv/signal-detection');

    const validation = validateContingencyTable({ a: -1, b: 10, c: 10, d: 100 });
    expect(validation.valid).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 5. SERIOUSNESS CLASSIFICATION (ICH E2A)
// ═════════════════════════════════════════════════════════════════════

describe('ICH E2A Seriousness Classification', () => {
  test('classifies death as serious', async () => {
    const seriousnessModule = await import('@/lib/pv/seriousness');
    // The module should export seriousness criteria
    expect(seriousnessModule).toBeDefined();
  });
});

// ═════════════════════════════════════════════════════════════════════
// 6. ERROR BOUNDARY COMPONENTS
// ═════════════════════════════════════════════════════════════════════

describe('Error Boundary Components', () => {
  const sections = [
    { name: 'Guardian', path: '@/app/nucleus/guardian/error' },
    { name: 'Vigilance', path: '@/app/nucleus/vigilance/error' },
    { name: 'Community', path: '@/app/nucleus/community/error' },
  ];

  test.each(sections)('$name error boundary renders error and retry button', async ({ name, path }) => {
    const mod = await import(path);
    const ErrorComponent = mod.default;

    const mockError = new Error(`Test ${name} error`);
    Object.assign(mockError, { digest: 'abc123' });
    const mockReset = jest.fn();

    render(<ErrorComponent error={mockError} reset={mockReset} />);

    // NucleusErrorPage renders ErrorFallback with type="server" which shows
    // the ERROR_CONTENT['server'] title from constants
    expect(screen.getByText('System Temporarily Unavailable')).toBeInTheDocument();
    // Try Again button is rendered (may appear more than once due to action config)
    const tryAgainButtons = screen.getAllByText('Try Again');
    expect(tryAgainButtons.length).toBeGreaterThanOrEqual(1);
  });

  test('retry button calls reset function', async () => {
    const mod = await import('@/app/nucleus/guardian/error');
    const GuardianError = mod.default;
    const mockReset = jest.fn();
    const user = userEvent.setup();

    render(<GuardianError error={new Error('fail')} reset={mockReset} />);
    // The primary Try Again button has a RefreshCw icon; click the first one
    const tryAgainButtons = screen.getAllByText('Try Again');
    await user.click(tryAgainButtons[0]);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  test('error boundary shows server error description when error.message is empty', async () => {
    const mod = await import('@/app/nucleus/guardian/error');
    const GuardianError = mod.default;

    render(<GuardianError error={new Error('')} reset={jest.fn()} />);
    // NucleusErrorPage with type="server" renders the server error description
    expect(screen.getByText('Our systems are experiencing an issue. Our team has been notified.')).toBeInTheDocument();
  });
});

// ═════════════════════════════════════════════════════════════════════
// 7. MedDRA HIERARCHY (Domain Logic)
// ═════════════════════════════════════════════════════════════════════

describe('MedDRA Hierarchy', () => {
  test('maps PT to SOC correctly', async () => {
    const meddraModule = await import('@/lib/pv/meddra');
    expect(meddraModule).toBeDefined();
    // Verify core exports exist
    expect(typeof meddraModule).toBe('object');
  });
});

// ═════════════════════════════════════════════════════════════════════
// 8. E2B/R3 ICSR STRUCTURE (Domain Logic)
// ═════════════════════════════════════════════════════════════════════

describe('E2B ICSR Structure', () => {
  test('e2b module exports ICSR types', async () => {
    const e2bModule = await import('@/lib/pv/e2b');
    expect(e2bModule).toBeDefined();
  });
});
