import type { HTMLAttributes, ReactNode } from 'react';

interface VisuallyHiddenProps extends HTMLAttributes<HTMLSpanElement> {
  /** Content to be hidden visually but accessible to screen readers */
  children: ReactNode;
  /** Element type to render (default: span) */
  as?: 'span' | 'div' | 'label';
}

/**
 * Visually hidden component for screen reader accessibility.
 * Hides content visually while keeping it accessible to assistive technologies.
 *
 * Use cases:
 * - Icon-only buttons that need text labels for screen readers
 * - Additional context for screen readers
 * - Form labels that are visually indicated by other means
 *
 * @example
 * <button>
 *   <SearchIcon />
 *   <VisuallyHidden>Search</VisuallyHidden>
 * </button>
 *
 * @example
 * <VisuallyHidden as="label" htmlFor="search">
 *   Search query
 * </VisuallyHidden>
 * <input id="search" placeholder="Search..." />
 */
export function VisuallyHidden({
  children,
  as: Component = 'span',
  ...props
}: VisuallyHiddenProps) {
  return (
    <Component
      {...props}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
        ...props.style,
      }}
    >
      {children}
    </Component>
  );
}
