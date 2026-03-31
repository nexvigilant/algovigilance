/**
 * Generate Form Tab Switching Tests
 *
 * Tests that the "Custom Topic" / "From PV Domain" tab switching
 * works correctly in the course generation form.
 *
 * Run with: npm test -- --testPathPattern=generate-form-tabs
 */

import React from 'react';
// Use /pure to prevent auto-cleanup which throws AggregateError in React 19
import { render, screen, waitFor, cleanup } from '@testing-library/react/pure';
import { act } from 'react';
import userEvent from '@testing-library/user-event';

// Mock use-ui-sounds to prevent AudioContext.close() TypeError in React 19 cleanup.
// In JSDOM there is no real AudioContext, so the ref holds a partial mock whose close()
// returns undefined instead of a Promise, causing `.catch()` to throw during effect
// teardown. This error gets collected by React 19's act() as an AggregateError.
jest.mock('@/hooks/use-ui-sounds', () => ({
  useUISounds: () => ({
    playHover: jest.fn(),
    playClick: jest.fn(),
    playAmbient: jest.fn(),
    playSuccess: jest.fn(),
    isReady: false,
  }),
}));

// Mock the router
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock the domain actions
const mockGetDomainsForSelector = jest.fn();
const mockGenerateCourseParamsFromDomain = jest.fn();
jest.mock(
  '@/app/nucleus/admin/academy/courses/generate/domain-actions',
  () => ({
    getDomainsForSelector: () => mockGetDomainsForSelector(),
    generateCourseParamsFromDomain: (domainId: string) =>
      mockGenerateCourseParamsFromDomain(domainId),
  })
);

// Mock the course builder API
jest.mock('@/lib/course-builder-api', () => ({
  generateCourse: jest.fn().mockResolvedValue({
    job_id: 'test-job-123',
    course_id: 'test-course-456',
  }),
}));

// Import component after mocks
import { GenerateFormClient } from '@/app/nucleus/admin/academy/courses/generate/generate-form-client';

// React 19 throws AggregateError during @testing-library/react cleanup()
// when async state updates are still pending. Using /pure import disables
// auto-cleanup; we handle it manually with error suppression.
afterEach(() => {
  try {
    cleanup();
  } catch {
    // Suppress React 19 AggregateError from pending async state updates
  }
});

describe('GenerateFormClient Tab Switching', () => {
  const mockDomains = [
    {
      id: 'D01',
      name: 'Fundamentals of Pharmacovigilance',
      definition: 'Core concepts and principles of drug safety',
      totalKSBs: 85,
      stats: { knowledge: 30, skills: 35, behaviors: 20 },
    },
    {
      id: 'D02',
      name: 'Regulatory Framework',
      definition: 'Understanding regulatory requirements',
      totalKSBs: 72,
      stats: { knowledge: 25, skills: 30, behaviors: 17 },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDomainsForSelector.mockResolvedValue(mockDomains);
    mockGenerateCourseParamsFromDomain.mockResolvedValue({
      topic: 'Fundamentals of Pharmacovigilance - Comprehensive Capability Development',
      domain: 'Life Sciences',
      targetAudience: 'Industry Professionals',
      durationMinutes: 45,
    });
  });

  it('should render with Custom Topic tab active by default', () => {
    render(<GenerateFormClient />);

    // Check that Custom Topic tab is active
    const customTab = screen.getByRole('tab', { name: /custom topic/i });
    expect(customTab).toHaveAttribute('data-state', 'active');

    // Check that topic input is visible (use placeholder to find it specifically)
    const topicInput = screen.getByPlaceholderText(/pharmacovigilance signal detection/i);
    expect(topicInput).toBeInTheDocument();
  });

  it('should switch to From PV Domain tab when clicked', async () => {
    const user = userEvent.setup();
    render(<GenerateFormClient />);

    // Find and click the "From PV Domain" tab
    const pvDomainTab = screen.getByRole('tab', { name: /from pv domain/i });
    await user.click(pvDomainTab);

    // Verify tab state changed
    expect(pvDomainTab).toHaveAttribute('data-state', 'active');

    // Custom Topic tab should no longer be active
    const customTab = screen.getByRole('tab', { name: /custom topic/i });
    expect(customTab).toHaveAttribute('data-state', 'inactive');
  });

  it('should load PV domains when switching to domain tab', async () => {
    const user = userEvent.setup();
    render(<GenerateFormClient />);

    // Click the PV Domain tab
    const pvDomainTab = screen.getByRole('tab', { name: /from pv domain/i });
    await user.click(pvDomainTab);

    // Should show loading state initially
    await waitFor(() => {
      expect(mockGetDomainsForSelector).toHaveBeenCalledTimes(1);
    });
  });

  it('should display domain selector after domains load', async () => {
    const user = userEvent.setup();
    render(<GenerateFormClient />);

    // Switch to domain tab
    const pvDomainTab = screen.getByRole('tab', { name: /from pv domain/i });
    await user.click(pvDomainTab);

    // Wait for domains to load and selector to appear
    await waitFor(() => {
      expect(screen.getByText(/choose a pv domain/i)).toBeInTheDocument();
    });
  });

  it('should switch back to Custom Topic tab', async () => {
    const user = userEvent.setup();
    render(<GenerateFormClient />);

    // Switch to domain tab first
    const pvDomainTab = screen.getByRole('tab', { name: /from pv domain/i });
    await user.click(pvDomainTab);

    // Then switch back to custom tab
    const customTab = screen.getByRole('tab', { name: /custom topic/i });
    await user.click(customTab);

    // Custom tab should be active again
    await waitFor(() => {
      expect(customTab).toHaveAttribute('data-state', 'active');
      expect(pvDomainTab).toHaveAttribute('data-state', 'inactive');
    });

    // Topic input should be visible
    const topicInput = screen.getByPlaceholderText(/pharmacovigilance signal detection/i);
    expect(topicInput).toBeInTheDocument();
  });

  it('should show error state and retry button when domain loading fails', async () => {
    // Make the domain fetch fail
    mockGetDomainsForSelector.mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<GenerateFormClient />);

    // Switch to domain tab
    const pvDomainTab = screen.getByRole('tab', { name: /from pv domain/i });
    await user.click(pvDomainTab);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/failed to load pv domains/i)).toBeInTheDocument();
    });

    // Should show retry button
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should retry loading domains when retry button is clicked', async () => {
    // First call fails, second succeeds
    mockGetDomainsForSelector
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockDomains);

    const user = userEvent.setup();
    render(<GenerateFormClient />);

    // Switch to domain tab - first load fails
    const pvDomainTab = screen.getByRole('tab', { name: /from pv domain/i });
    await user.click(pvDomainTab);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/failed to load pv domains/i)).toBeInTheDocument();
    });

    // Click retry using act() to properly wrap the state update cascade.
    // The use-ui-sounds mock prevents the AudioContext.close() TypeError that
    // previously caused React 19's act() to throw AggregateError.
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await act(async () => {
      retryButton.click();
      // Allow the async loadPVDomains to resolve
      await new Promise((r) => setTimeout(r, 50));
    });

    // Should load successfully now
    await waitFor(() => {
      expect(screen.getByText(/choose a pv domain/i)).toBeInTheDocument();
    });

    expect(mockGetDomainsForSelector).toHaveBeenCalledTimes(2);
  });

  it('should maintain form state when switching tabs', async () => {
    const user = userEvent.setup();
    render(<GenerateFormClient />);

    // Fill in the topic field (use placeholder to find it)
    const topicInput = screen.getByPlaceholderText(/pharmacovigilance signal detection/i);
    await user.type(topicInput, 'Test Course Topic');

    // Switch to domain tab
    const pvDomainTab = screen.getByRole('tab', { name: /from pv domain/i });
    await user.click(pvDomainTab);

    // Switch back to custom tab
    const customTab = screen.getByRole('tab', { name: /custom topic/i });
    await user.click(customTab);

    // Topic input should still have the value
    await waitFor(() => {
      const topicInputAfter = screen.getByPlaceholderText(/pharmacovigilance signal detection/i);
      expect(topicInputAfter).toHaveValue('Test Course Topic');
    });
  });

  it('should auto-populate form fields when domain is selected', async () => {
    const user = userEvent.setup();
    render(<GenerateFormClient />);

    // Switch to domain tab
    const pvDomainTab = screen.getByRole('tab', { name: /from pv domain/i });
    await user.click(pvDomainTab);

    // Wait for domains to load and PV domain selector to appear
    await waitFor(() => {
      expect(screen.getByText(/choose a pv domain/i)).toBeInTheDocument();
    });

    // Find the PV Domain select by looking for the button with "Choose a PV domain" text
    const pvDomainSelect = screen.getByText(/choose a pv domain/i).closest('button');
    expect(pvDomainSelect).toBeInTheDocument();
    if (!pvDomainSelect) throw new Error('PV Domain select button not found');
    await user.click(pvDomainSelect);

    // Wait for options to appear and select the right one (use getByRole option)
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });

    // Find the specific option by role and name
    const options = screen.getAllByRole('option');
    const d01Option = options.find(opt => opt.textContent?.includes('D01'));
    expect(d01Option).toBeDefined();
    if (!d01Option) throw new Error('D01 option not found');
    await user.click(d01Option);

    // Should call generateCourseParamsFromDomain
    await waitFor(() => {
      expect(mockGenerateCourseParamsFromDomain).toHaveBeenCalledWith('D01');
    });
  });
});

describe('GenerateFormClient Tab Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDomainsForSelector.mockResolvedValue([]);
  });

  it('should have proper ARIA attributes on tabs', () => {
    render(<GenerateFormClient />);

    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);

    tabs.forEach((tab) => {
      expect(tab).toHaveAttribute('aria-selected');
    });
  });

  it('should be keyboard navigable', async () => {
    const user = userEvent.setup();
    render(<GenerateFormClient />);

    // Click on Custom tab first to focus it
    const customTab = screen.getByRole('tab', { name: /custom topic/i });
    await user.click(customTab);

    // Press arrow right to move to next tab
    await user.keyboard('{ArrowRight}');

    // PV Domain tab should now be focused
    await waitFor(() => {
      const pvDomainTab = screen.getByRole('tab', { name: /from pv domain/i });
      expect(document.activeElement).toBe(pvDomainTab);
    });
  });

  it('should activate tab on Enter key', async () => {
    const user = userEvent.setup();
    render(<GenerateFormClient />);

    // Click on Custom tab first, then arrow to PV Domain
    const customTab = screen.getByRole('tab', { name: /custom topic/i });
    await user.click(customTab);
    await user.keyboard('{ArrowRight}');

    // Press Enter to activate the PV Domain tab
    await user.keyboard('{Enter}');

    // Tab should be active
    await waitFor(() => {
      const pvDomainTab = screen.getByRole('tab', { name: /from pv domain/i });
      expect(pvDomainTab).toHaveAttribute('data-state', 'active');
    });
  });
});
