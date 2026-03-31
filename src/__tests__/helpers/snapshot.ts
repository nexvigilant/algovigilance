/**
 * Advanced Testing Utilities - Snapshot Testing
 */

/**
 * Create a snapshot of component output
 *
 * @example
 * ```tsx
 * test('renders correctly', () => {
 *   const { container } = render(<MyComponent />);
 *   expect(createSnapshot(container)).toMatchSnapshot();
 * });
 * ```
 */
export function createSnapshot(element: HTMLElement): string {
  return element.innerHTML;
}

/**
 * Create a normalized snapshot (removes dynamic IDs, timestamps, etc.)
 */
export function createNormalizedSnapshot(element: HTMLElement): string {
  let html = element.innerHTML;

  // Remove dynamic IDs
  html = html.replace(/id="[^"]*"/g, 'id="NORMALIZED"');

  // Remove timestamps
  html = html.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP');

  // Remove random keys
  html = html.replace(/data-key="[^"]*"/g, 'data-key="NORMALIZED"');

  return html;
}

/**
 * Compare snapshots
 */
export function compareSnapshots(snapshot1: string, snapshot2: string): boolean {
  return snapshot1 === snapshot2;
}
