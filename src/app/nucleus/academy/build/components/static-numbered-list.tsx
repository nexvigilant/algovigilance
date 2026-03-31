'use client';

interface StaticListItem {
  number: number;
  title: string;
  category?: string;
}

interface StaticNumberedListProps {
  title?: string;
  items: StaticListItem[];
  columns?: 1 | 2 | 3;
  variant?: 'default' | 'compact' | 'highlighted';
  showCategories?: boolean;
}

/**
 * Static Numbered List Component
 *
 * Purpose: Clean, non-interactive presentation of enumerated items
 * Use when: Items don't need expansion/interaction, just clear listing
 *
 * Features:
 * - Clean numbered badges
 * - Responsive columns
 * - Optional categories
 * - No false affordances (clearly non-interactive)
 * - Print-optimized layout
 */
export function StaticNumberedList({
  title,
  items,
  columns = 1,
  variant = 'default',
  showCategories = false,
}: StaticNumberedListProps) {
  const getColumnClass = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      default:
        return 'grid-cols-1';
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'compact':
        return 'p-3 gap-3';
      case 'highlighted':
        return 'p-5 gap-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950';
      default:
        return 'p-4 gap-4';
    }
  };

  return (
    <div className="static-numbered-list-container">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      )}

      <div className={`grid ${getColumnClass()} gap-3`}>
        {items.map((item, index) => (
          <div
            key={index}
            className={`
              flex items-start gap-3 ${getVariantClass()}
              rounded-lg border border-gray-200 dark:border-gray-800
              bg-white dark:bg-gray-900
              ${variant === 'highlighted' ? 'shadow-sm' : ''}
              transition-colors duration-200
            `}
          >
            {/* Number Badge - clearly static, not clickable */}
            <div
              className={`
                flex-shrink-0 w-8 h-8 rounded-full
                bg-gradient-to-br from-cyan to-cyan-muted
                text-white font-bold text-sm
                flex items-center justify-center
                shadow-sm
              `}
              aria-label={`Item ${item.number}`}
            >
              {item.number}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {item.title}
              </div>
              {showCategories && item.category && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {item.category}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Optional summary */}
      {items.length > 10 && (
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          {items.length} items total
        </div>
      )}
    </div>
  );
}

/**
 * Simplified version for inline use within content
 */
export function InlineNumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2 ml-6 list-none">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3">
          <span className="
            flex-shrink-0 w-6 h-6 rounded-full
            bg-cyan-faint dark:bg-cyan-deep
            text-cyan-dark dark:text-cyan-soft
            text-xs font-semibold
            flex items-center justify-center
          ">
            {index + 1}
          </span>
          <span className="text-gray-700 dark:text-gray-300">{item}</span>
        </li>
      ))}
    </ol>
  );
}