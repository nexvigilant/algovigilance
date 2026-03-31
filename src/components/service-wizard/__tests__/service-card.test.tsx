/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ServiceCard } from '../service-card';
import type { ServiceRecommendation } from '@/types/service-wizard';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Compass: ({ className }: { className?: string }) => (
    <svg data-testid="icon-compass" className={className} />
  ),
  Telescope: ({ className }: { className?: string }) => (
    <svg data-testid="icon-telescope" className={className} />
  ),
  Target: ({ className }: { className?: string }) => (
    <svg data-testid="icon-target" className={className} />
  ),
  Users: ({ className }: { className?: string }) => (
    <svg data-testid="icon-users" className={className} />
  ),
  Code: ({ className }: { className?: string }) => (
    <svg data-testid="icon-code" className={className} />
  ),
  CheckCircle: ({ className }: { className?: string }) => (
    <svg data-testid="icon-check" className={className} />
  ),
  FileText: ({ className }: { className?: string }) => (
    <svg data-testid="icon-file" className={className} />
  ),
}));

// Test fixtures
const mockRecommendation: ServiceRecommendation = {
  category: 'strategic',
  score: 85,
  confidence: 0.9,
  rank: 1,
  headline: 'Transform your pharmacovigilance strategy',
  outcomes: [
    'Clear strategic direction with measurable objectives',
    'Defensible competitive positioning',
    'Execution roadmap with decision gates',
  ],
};

const mockSecondaryRecommendation: ServiceRecommendation = {
  category: 'innovation',
  score: 70,
  confidence: 0.8,
  rank: 2,
  headline: 'Stay ahead of regulatory changes',
  outcomes: [
    'Early identification of threats',
    'Actionable intelligence',
    'Proactive positioning',
    'Strategic resilience',
  ],
};

describe('ServiceCard', () => {
  describe('primary card rendering', () => {
    it('renders the service title', () => {
      render(<ServiceCard recommendation={mockRecommendation} isPrimary={true} />);

      expect(screen.getByText('Strategic Positioning')).toBeInTheDocument();
    });

    it('renders the headline', () => {
      render(<ServiceCard recommendation={mockRecommendation} isPrimary={true} />);

      expect(screen.getByText('Transform your pharmacovigilance strategy')).toBeInTheDocument();
    });

    it('renders all outcomes for primary card', () => {
      render(<ServiceCard recommendation={mockRecommendation} isPrimary={true} />);

      expect(screen.getByText('Clear strategic direction with measurable objectives')).toBeInTheDocument();
      expect(screen.getByText('Defensible competitive positioning')).toBeInTheDocument();
      expect(screen.getByText('Execution roadmap with decision gates')).toBeInTheDocument();
    });

    it('renders outcomes section header', () => {
      render(<ServiceCard recommendation={mockRecommendation} isPrimary={true} />);

      expect(screen.getByText("What You'll Achieve")).toBeInTheDocument();
    });

    it('renders deliverables section', () => {
      render(<ServiceCard recommendation={mockRecommendation} isPrimary={true} />);

      expect(screen.getByText('Example Key Deliverables')).toBeInTheDocument();
      expect(screen.getByText('Strategic Direction Report')).toBeInTheDocument();
    });

    it('renders the category icon', () => {
      render(<ServiceCard recommendation={mockRecommendation} isPrimary={true} />);

      // Strategic uses Compass icon
      expect(screen.getByTestId('icon-compass')).toBeInTheDocument();
    });

    it('renders check icons for outcomes', () => {
      render(<ServiceCard recommendation={mockRecommendation} isPrimary={true} />);

      const checkIcons = screen.getAllByTestId('icon-check');
      expect(checkIcons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('secondary card rendering', () => {
    it('renders the service title', () => {
      render(<ServiceCard recommendation={mockSecondaryRecommendation} isPrimary={false} />);

      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    });

    it('renders the headline', () => {
      render(<ServiceCard recommendation={mockSecondaryRecommendation} isPrimary={false} />);

      expect(screen.getByText('Stay ahead of regulatory changes')).toBeInTheDocument();
    });

    it('only renders first 2 outcomes for secondary card', () => {
      render(<ServiceCard recommendation={mockSecondaryRecommendation} isPrimary={false} />);

      // Should show first 2
      expect(screen.getByText('Early identification of threats')).toBeInTheDocument();
      expect(screen.getByText('Actionable intelligence')).toBeInTheDocument();

      // Should NOT show 3rd and 4th
      expect(screen.queryByText('Proactive positioning')).not.toBeInTheDocument();
      expect(screen.queryByText('Strategic resilience')).not.toBeInTheDocument();
    });

    it('does not render deliverables section', () => {
      render(<ServiceCard recommendation={mockSecondaryRecommendation} isPrimary={false} />);

      expect(screen.queryByText('Example Key Deliverables')).not.toBeInTheDocument();
    });

    it('uses correct icon for innovation category', () => {
      render(<ServiceCard recommendation={mockSecondaryRecommendation} isPrimary={false} />);

      // Innovation uses Telescope icon
      expect(screen.getByTestId('icon-telescope')).toBeInTheDocument();
    });
  });

  describe('category icon mapping', () => {
    it('uses Compass for strategic', () => {
      render(<ServiceCard recommendation={{ ...mockRecommendation, category: 'strategic' }} isPrimary={false} />);
      expect(screen.getByTestId('icon-compass')).toBeInTheDocument();
    });

    it('uses Telescope for innovation', () => {
      render(<ServiceCard recommendation={{ ...mockRecommendation, category: 'innovation' }} isPrimary={false} />);
      expect(screen.getByTestId('icon-telescope')).toBeInTheDocument();
    });

    it('uses Target for tactical', () => {
      render(<ServiceCard recommendation={{ ...mockRecommendation, category: 'tactical' }} isPrimary={false} />);
      expect(screen.getByTestId('icon-target')).toBeInTheDocument();
    });

    it('uses Users for talent', () => {
      render(<ServiceCard recommendation={{ ...mockRecommendation, category: 'talent' }} isPrimary={false} />);
      expect(screen.getByTestId('icon-users')).toBeInTheDocument();
    });

    it('uses Code for technology', () => {
      render(<ServiceCard recommendation={{ ...mockRecommendation, category: 'technology' }} isPrimary={false} />);
      expect(screen.getByTestId('icon-code')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies larger padding for primary card', () => {
      const { container } = render(<ServiceCard recommendation={mockRecommendation} isPrimary={true} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('p-6');
      expect(card.className).toContain('md:p-8');
    });

    it('applies smaller padding for secondary card', () => {
      const { container } = render(<ServiceCard recommendation={mockRecommendation} isPrimary={false} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('p-5');
    });

    it('applies border-2 for primary card emphasis', () => {
      const { container } = render(<ServiceCard recommendation={mockRecommendation} isPrimary={true} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('border-2');
    });
  });
});
