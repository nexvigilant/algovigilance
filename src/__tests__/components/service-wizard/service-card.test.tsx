/**
 * Service Card Component Tests
 *
 * Tests the component structure, Learn More links, color/icon mapping,
 * and layouts for primary vs secondary service cards.
 *
 * Run with: npm test -- service-card
 */

import fs from 'fs';
import path from 'path';

describe('ServiceCard Component', () => {
  const componentPath = path.join(
    process.cwd(),
    'src',
    'components',
    'service-wizard',
    'service-card.tsx'
  );

  test('component file should exist', () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  test('should be a client component', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain("'use client'");
  });

  test('should export ServiceCard function', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).toContain('export function ServiceCard');
  });

  describe('Props Interface', () => {
    test('should define ServiceCardProps interface', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('interface ServiceCardProps');
    });

    test('should have recommendation prop', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('recommendation:');
    });

    test('should have isPrimary prop', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('isPrimary');
    });
  });

  describe('Service Categories', () => {
    test('should use category from recommendation', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('category');
    });

    test('should look up service info by category', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('serviceInfo[category]');
    });

    test('should destructure category from recommendation', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('{ category');
    });
  });

  describe('Icon Mapping', () => {
    test('should import lucide-react icons', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain("from 'lucide-react'");
    });

    test('should have icon mapping for service categories', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      // Check for icon map or icon selection logic
      expect(content).toContain('Icon');
    });

    test('should use CheckCircle icon for outcomes', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('CheckCircle');
    });
  });

  describe('Color System', () => {
    test('should use getServiceColorClasses for colors', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('getServiceColorClasses');
    });

    test('should apply color classes from info', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('colors.border');
      expect(content).toContain('colors.bg');
      expect(content).toContain('colors.text');
    });

    test('should have different styling for primary vs secondary', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('isPrimary');
    });
  });

  describe('Icon Map', () => {
    test('should define iconMap for category icons', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('iconMap');
    });

    test('should have Compass as fallback icon', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('|| Compass');
    });

    test('should use category info.icon to select icon', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('info.icon');
    });

    test('should support multiple icon types', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('Telescope');
      expect(content).toContain('Target');
    });
  });

  describe('Service Info Integration', () => {
    test('should import serviceInfo', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain("serviceInfo");
      expect(content).toContain("from '@/data/service-outcomes'");
    });

    test('should access service title', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('.title');
    });

    test('should display headline from recommendation', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('headline');
    });
  });

  describe('Primary Card Layout', () => {
    test('should display outcomes section for primary', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('outcomes');
    });

    test('should display deliverables section for primary', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('deliverables');
    });

    test('should have section header for outcomes', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain("What You'll Achieve");
    });

    test('should have section header for deliverables', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('Key Deliverables');
    });
  });

  describe('Secondary Card Layout', () => {
    test('should render compact layout when not primary', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      // Uses early return pattern with if (isPrimary)
      expect(content).toContain('if (isPrimary)');
      expect(content).toContain('// Secondary/compact card');
    });

    test('should slice outcomes to show only first 2', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('.slice(0, 2)');
    });
  });

  describe('Styling', () => {
    test('should use cn utility for className merging', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain("import { cn }");
      expect(content).toContain('cn(');
    });

    test('should have rounded corners', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('rounded');
    });

    test('should have border styling', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('border');
    });

    test('should have padding', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('p-');
    });
  });

  describe('Accessibility', () => {
    test('should have hover states for links', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('hover:');
    });

    test('should have hover transition for card', () => {
      const content = fs.readFileSync(componentPath, 'utf-8');
      expect(content).toContain('transition');
    });
  });
});

describe('ServiceCard Service Data Integration', () => {
  const serviceOutcomesPath = path.join(
    process.cwd(),
    'src',
    'data',
    'service-outcomes.ts'
  );

  test('service-outcomes.ts should exist', () => {
    expect(fs.existsSync(serviceOutcomesPath)).toBe(true);
  });

  test('should export serviceInfo object', () => {
    const content = fs.readFileSync(serviceOutcomesPath, 'utf-8');
    expect(content).toContain('export const serviceInfo');
  });

  test('should have detailLink pointing to consulting page', () => {
    const content = fs.readFileSync(serviceOutcomesPath, 'utf-8');
    // All services now link to the main consulting page
    expect(content).toContain("detailLink: '/consulting'");
  });
});

describe('ServiceCard Detail Pages', () => {
  const consultingPagesDir = path.join(
    process.cwd(),
    'src',
    'app',
    '(public)',
    'consulting'
  );

  test('consulting page should exist', () => {
    const pagePath = path.join(consultingPagesDir, 'page.tsx');
    expect(fs.existsSync(pagePath)).toBe(true);
  });
});
