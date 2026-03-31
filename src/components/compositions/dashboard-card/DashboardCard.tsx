'use client';

/**
 * DashboardCard - Pre-built card component for dashboards
 *
 * Features:
 * - Loading states
 * - Error states
 * - Empty states
 * - Header with actions
 * - Responsive grid support
 * - Icon support
 *
 * @example
 * ```tsx
 * <DashboardCard
 *   title="Total Users"
 *   value="1,234"
 *   change="+12%"
 *   trend="up"
 *   icon={<UsersIcon />}
 *   loading={loading}
 * />
 * ```
 */

import { ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface DashboardCardProps {
  title: string;
  value?: string | number;
  description?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  loading?: boolean;
  error?: string;
  empty?: boolean;
  emptyMessage?: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
  onClick?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const TREND_COLORS = {
  up: 'text-green-600',
  down: 'text-red-600',
  neutral: 'text-gray-600',
} as const;

const TREND_ICONS = {
  up: '↑',
  down: '↓',
  neutral: '→',
} as const;

// ============================================================================
// Component
// ============================================================================

export function DashboardCard({
  title,
  value,
  description,
  change,
  trend = 'neutral',
  icon,
  loading = false,
  error,
  empty = false,
  emptyMessage = 'No data available',
  children,
  actions,
  className = '',
  onClick,
}: DashboardCardProps) {

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-red-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800">{title}</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (empty) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // Normal state
  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 p-6
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {icon && <div className="text-gray-400">{icon}</div>}
            <h3 className="text-sm font-semibold text-gray-600">{title}</h3>
          </div>
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>

      {/* Value */}
      {value !== undefined && (
        <div className="mb-2">
          <div className="text-3xl font-bold text-gray-900">{value}</div>
        </div>
      )}

      {/* Description or Children */}
      {children ? (
        <div className="mt-4">{children}</div>
      ) : (
        <>
          {/* Change indicator */}
          {change && (
            <div className="flex items-center gap-1">
              <span className={`text-sm font-semibold ${TREND_COLORS[trend]}`}>
                {TREND_ICONS[trend]} {change}
              </span>
              {description && (
                <span className="text-sm text-gray-500">{description}</span>
              )}
            </div>
          )}

          {/* Description only */}
          {!change && description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// Preset Variants
// ============================================================================

/**
 * Stat card variant - shows a key metric
 */
export function StatCard({
  title,
  value,
  change,
  trend,
  icon,
  ...props
}: Omit<DashboardCardProps, 'children'>) {
  return (
    <DashboardCard
      title={title}
      value={value}
      change={change}
      trend={trend}
      icon={icon}
      {...props}
    />
  );
}

/**
 * Chart card variant - container for charts
 */
export function ChartCard({
  title,
  children,
  actions,
  ...props
}: Pick<DashboardCardProps, 'title' | 'children' | 'actions' | 'loading' | 'error' | 'className'>) {
  return (
    <DashboardCard
      title={title}
      actions={actions}
      {...props}
    >
      <div className="mt-4">
        {children}
      </div>
    </DashboardCard>
  );
}

/**
 * List card variant - shows a list of items
 */
export function ListCard({
  title,
  items,
  renderItem,
  emptyMessage,
  ...props
}: Omit<DashboardCardProps, 'children' | 'value'> & {
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
}) {
  return (
    <DashboardCard
      title={title}
      empty={items.length === 0}
      emptyMessage={emptyMessage}
      {...props}
    >
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index}>{renderItem(item, index)}</div>
        ))}
      </div>
    </DashboardCard>
  );
}

// Named exports preferred for tree-shaking
