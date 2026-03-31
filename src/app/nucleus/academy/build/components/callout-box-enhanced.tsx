'use client';

import { type ReactNode } from 'react';

export type CalloutType =
  | 'career-critical'
  | 'capability-accelerator'
  | 'red-flag'
  | 'real-world'
  | 'data-point';

interface CalloutBoxProps {
  type: CalloutType;
  label?: string;
  children: ReactNode;
}

/**
 * Custom SVG Icons inspired by AlgoVigilance eye logo
 * Each icon maintains the vigilant/watchful theme while being specific to its purpose
 */
const CalloutIcons = {
  'career-critical': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Target/Career Eye - concentric circles with eye pupil */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
      {/* Sight lines */}
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'capability-accelerator': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Lightning Eye - eye with electric power */}
      <path d="M1 12s3-7 11-7 11 7 11 7-3 7-11 7-11-7-11-7z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
      {/* Lightning bolt through eye */}
      <path d="M13 8l-3 4h4l-3 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'red-flag': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Alert Eye - eye with warning triangle */}
      <path d="M1 12s3-7 11-7 11 7 11 7-3 7-11 7-11-7-11-7z" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 9v3M12 15.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
      {/* Alert rays */}
      <path d="M12 2l1 3M12 22l1-3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12l3 1M22 12l-3 1M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  'real-world': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Globe Eye - eye seeing the world */}
      <path d="M1 12s3-7 11-7 11 7 11 7-3 7-11 7-11-7-11-7z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
      {/* Globe lines */}
      <path d="M12 5c-2 0-3 3.5-3 7s1 7 3 7M12 5c2 0 3 3.5 3 7s-1 7-3 7" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
    </svg>
  ),
  'data-point': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Data Eye - eye with chart bars */}
      <path d="M1 12s3-7 11-7 11 7 11 7-3 7-11 7-11-7-11-7z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
      {/* Data bars */}
      <rect x="6" y="14" width="2" height="4" fill="currentColor" opacity="0.6"/>
      <rect x="11" y="10" width="2" height="8" fill="currentColor" opacity="0.6"/>
      <rect x="16" y="12" width="2" height="6" fill="currentColor" opacity="0.6"/>
    </svg>
  ),
};

/**
 * Enhanced callout system with custom SVG icons and improved color semantics
 *
 * Color Semantics (updated):
 * - Purple (#a855f7): Career Critical - professional development
 * - Cyan (#06b6d4): Capability Accelerator - skills growth
 * - Red (#ef4444): Red Flag - warnings and critical alerts
 * - Green (#10b981): Real-World - practical application
 * - Blue (#3b82f6): Data Point - evidence and statistics
 */
export function CalloutBoxEnhanced({ type, label, children }: CalloutBoxProps) {
  const defaultLabels: Record<CalloutType, string> = {
    'career-critical': 'Career Critical',
    'capability-accelerator': 'Capability Accelerator',
    'red-flag': 'Critical Alert',
    'real-world': 'Real-World Application',
    'data-point': 'Data Point',
  };

  const colorClasses: Record<CalloutType, string> = {
    'career-critical': 'text-purple-500 border-purple-500 bg-purple-50 dark:bg-purple-950/20',
    'capability-accelerator': 'text-cyan-500 border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20',
    'red-flag': 'text-red-500 border-red-500 bg-red-50 dark:bg-red-950/20',
    'real-world': 'text-green-500 border-green-500 bg-green-50 dark:bg-green-950/20',
    'data-point': 'text-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-950/20',
  };

  return (
    <div
      className={`
        relative flex gap-3 p-4 rounded-lg border-l-4 transition-all duration-200
        hover:shadow-md hover:-translate-y-0.5
        ${colorClasses[type]}
      `}
      role="note"
      aria-label={`${label || defaultLabels[type]} callout`}
    >
      {/* Custom SVG Icon (no circle background) */}
      <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
        {CalloutIcons[type]}
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-1">
        <div className="font-semibold text-sm tracking-wide uppercase opacity-90">
          {label || defaultLabels[type]}
        </div>
        <div className="text-sm leading-relaxed">{children}</div>
      </div>

      {/* Type-specific animation for red flag */}
      {type === 'red-flag' && (
        <div className="absolute inset-0 rounded-lg pointer-events-none">
          <div className="absolute inset-0 border-2 border-red-500 rounded-lg animate-pulse opacity-30" />
        </div>
      )}
    </div>
  );
}