/**
 * Advanced Testing Utilities - Interaction Testing
 */

import { render, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

export interface InteractionTestContext {
  user: ReturnType<typeof userEvent.setup>;
  render: (ui: ReactElement) => RenderResult;
}

/**
 * Create interaction test context with user-event setup
 *
 * @example
 * ```tsx
 * testInteraction('button click', async ({ user, render }) => {
 *   const { getByRole } = render(<MyButton />);
 *   const button = getByRole('button');
 *
 *   await user.click(button);
 *
 *   expect(button).toHaveAttribute('aria-pressed', 'true');
 * });
 * ```
 */
export function testInteraction(
  name: string,
  testFn: (context: InteractionTestContext) => Promise<void>
) {
  test(name, async () => {
    const user = userEvent.setup();

    const context: InteractionTestContext = {
      user,
      render,
    };

    await testFn(context);
  });
}

/**
 * Test keyboard navigation
 */
export async function testKeyboardNavigation(
  element: HTMLElement,
  keys: string[],
  assertions: (element: HTMLElement) => void
) {
  const user = userEvent.setup();

  for (const key of keys) {
    await user.keyboard(key);
  }

  assertions(element);
}

/**
 * Test focus management
 */
export async function testFocusManagement(
  container: HTMLElement,
  expectedFocusOrder: string[]
) {
  const user = userEvent.setup();

  for (const selector of expectedFocusOrder) {
    await user.tab();

    const activeElement = container.ownerDocument.activeElement;
    const expectedElement = container.querySelector(selector);

    expect(activeElement).toBe(expectedElement);
  }
}
