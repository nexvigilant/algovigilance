/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackedLink } from '../tracked-link';

const mockTrack = jest.fn();

jest.mock('@/hooks/use-analytics', () => ({
  useAnalytics: () => ({ track: mockTrack }),
}));

jest.mock('next/link', () => {
  return function MockLink({
    href,
    children,
    onClick,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    className?: string;
  }) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {children}
      </a>
    );
  };
});

beforeEach(() => {
  mockTrack.mockClear();
});

describe('TrackedLink', () => {
  it('renders children and correct href', () => {
    render(
      <TrackedLink href="/station/connect" event="connect_ai_clicked">
        Connect Your AI
      </TrackedLink>,
    );
    const link = screen.getByRole('link', { name: 'Connect Your AI' });
    expect(link).toHaveAttribute('href', '/station/connect');
  });

  it('calls track() with event and properties on click', () => {
    render(
      <TrackedLink
        href="/auth/signup"
        event="signup_started"
        properties={{ location: 'pricing_card' }}
      >
        Sign Up Free
      </TrackedLink>,
    );
    fireEvent.click(screen.getByRole('link'));
    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith('signup_started', {
      location: 'pricing_card',
    });
  });

  it('calls custom onClick in addition to track()', () => {
    const customClick = jest.fn();
    render(
      <TrackedLink
        href="/pricing"
        event="button_click"
        onClick={customClick}
      >
        Pricing
      </TrackedLink>,
    );
    fireEvent.click(screen.getByRole('link'));
    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(customClick).toHaveBeenCalledTimes(1);
  });

  it('does not throw when onClick is not provided', () => {
    render(
      <TrackedLink href="/station" event="button_click">
        Station
      </TrackedLink>,
    );
    expect(() => fireEvent.click(screen.getByRole('link'))).not.toThrow();
  });
});
