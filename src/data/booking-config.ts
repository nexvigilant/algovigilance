/**
 * Booking Configuration
 * 
 * Maps organizational maturity tiers to specific consultation protocols.
 */

import { URLS } from '@/lib/constants/urls';

export interface BookingProtocol {
  tier: 'Reactive' | 'Standardized' | 'Optimized' | 'Intelligence-Led';
  title: string;
  description: string;
  calendarUrl: string;
}

export const bookingProtocols: Record<string, BookingProtocol> = {
  'Reactive': {
    tier: 'Reactive',
    title: 'Quick Diagnostic & Project Rescue',
    description: 'A focused session to identify what\'s going wrong and get things back on track.',
    calendarUrl: URLS.bookingCalendar, // Default
  },
  'Standardized': {
    tier: 'Standardized',
    title: 'Capability Uplift Strategy',
    description: 'Moving from manual compliance processes to integrated, data-driven oversight.',
    calendarUrl: URLS.bookingCalendar,
  },
  'Optimized': {
    tier: 'Optimized',
    title: 'Strategic Foresight Consultation',
    description: 'Refining mature operations with advanced signal detection and predictive benchmarking.',
    calendarUrl: URLS.bookingCalendar,
  },
  'Intelligence-Led': {
    tier: 'Intelligence-Led',
    title: 'Executive Leadership Briefing',
    description: 'Executive-level session on shaping industry standards and building lasting advantages.',
    calendarUrl: URLS.bookingCalendar,
  },
};

/**
 * Gets the appropriate booking protocol based on maturity score (1-4)
 */
export function getBookingProtocol(maturityScore: number): BookingProtocol {
  const tiers: BookingProtocol['tier'][] = ['Reactive', 'Standardized', 'Optimized', 'Intelligence-Led'];
  const index = Math.max(0, Math.min(3, Math.floor(maturityScore) - 1));
  return bookingProtocols[tiers[index]];
}
