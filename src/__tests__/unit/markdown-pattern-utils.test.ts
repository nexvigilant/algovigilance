/**
 * Unit Tests: Markdown Pattern Detection Utilities
 *
 * Tests the pattern detection functions used by EnhancedMarkdownV2
 * to identify and style various content types (timelines, metrics, comparisons, etc.)
 */

import {
  detectCalloutType,
  stripCalloutEmoji,
  isKeyTakeawayHeader,
  isStatsHeader,
  isReferencesHeader,
  isPullQuote,
  detectStatPattern,
  generateHeadingId,
  detectNumberedHeader,
  isStrategicInsight,
  isActionItem,
  isExecutiveSummaryHeader,
  isAbstractHeader,
  isActionsHeader,
  detectInsightVariant,
  isTimelineHeader,
  isComparisonHeader,
  isMetricsHeader,
  detectTimelinePattern,
  detectComparisonItem,
  detectMetricBar,
  isTableRow,
  parseTableRow,
  isTableSeparator,
} from '@/components/intelligence/markdown-pattern-utils';

describe('Callout Detection', () => {
  describe('detectCalloutType', () => {
    it('should detect tip emoji', () => {
      expect(detectCalloutType('💡 This is a tip')).toBe('tip');
      expect(detectCalloutType('⚡ Quick tip here')).toBe('tip');
    });

    it('should detect warning emoji', () => {
      expect(detectCalloutType('⚠️ Be careful!')).toBe('warning');
    });

    it('should detect info emoji', () => {
      expect(detectCalloutType('📝 Note this down')).toBe('info');
      expect(detectCalloutType('📊 Stats show...')).toBe('info');
    });

    it('should detect success emoji', () => {
      expect(detectCalloutType('✅ All done!')).toBe('success');
    });

    it('should detect insight emoji', () => {
      expect(detectCalloutType('🎯 Key insight')).toBe('insight');
      expect(detectCalloutType('🔍 Looking deeper')).toBe('insight');
    });

    it('should return null for text without callout emoji', () => {
      expect(detectCalloutType('Plain text')).toBeNull();
      expect(detectCalloutType('Text with emoji at end 💡')).toBeNull();
    });

    it('should handle whitespace', () => {
      expect(detectCalloutType('  💡 Tip with spaces')).toBe('tip');
    });
  });

  describe('stripCalloutEmoji', () => {
    it('should remove callout emoji from start', () => {
      expect(stripCalloutEmoji('💡 This is content')).toBe('This is content');
      expect(stripCalloutEmoji('⚠️ Warning message')).toBe('Warning message');
    });

    it('should preserve text without emoji', () => {
      expect(stripCalloutEmoji('Plain text')).toBe('Plain text');
    });

    it('should handle whitespace', () => {
      expect(stripCalloutEmoji('  💡  Content  ')).toBe('Content');
    });
  });
});

describe('Header Detection', () => {
  describe('isKeyTakeawayHeader', () => {
    it('should detect key takeaway headers', () => {
      expect(isKeyTakeawayHeader('Key Takeaways')).toBe(true);
      expect(isKeyTakeawayHeader('Key Takeaway')).toBe(true);
      expect(isKeyTakeawayHeader('The Bottom Line')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isKeyTakeawayHeader('KEY TAKEAWAYS')).toBe(true);
      expect(isKeyTakeawayHeader('key takeaway')).toBe(true);
    });

    it('should not match unrelated headers', () => {
      expect(isKeyTakeawayHeader('Introduction')).toBe(false);
      expect(isKeyTakeawayHeader('Summary')).toBe(false);
    });
  });

  describe('isStatsHeader', () => {
    it('should detect stats headers', () => {
      expect(isStatsHeader('By the Numbers')).toBe(true);
      expect(isStatsHeader('Quick Stats')).toBe(true);
      expect(isStatsHeader('Key Statistics')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isStatsHeader('BY THE NUMBERS')).toBe(true);
    });
  });

  describe('isReferencesHeader', () => {
    it('should detect references headers', () => {
      expect(isReferencesHeader('References')).toBe(true);
      expect(isReferencesHeader('Sources')).toBe(true);
      expect(isReferencesHeader('Citations')).toBe(true);
    });
  });

  describe('isTimelineHeader', () => {
    it('should detect timeline headers', () => {
      expect(isTimelineHeader('Timeline')).toBe(true);
      expect(isTimelineHeader('Project Timeline')).toBe(true);
      expect(isTimelineHeader('Key Milestones')).toBe(true);
      expect(isTimelineHeader('Roadmap')).toBe(true);
      expect(isTimelineHeader('Schedule')).toBe(true);
      expect(isTimelineHeader('History')).toBe(true);
      expect(isTimelineHeader('Chronology')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isTimelineHeader('TIMELINE')).toBe(true);
      expect(isTimelineHeader('Key Dates')).toBe(true);
    });

    it('should not match unrelated headers', () => {
      expect(isTimelineHeader('Introduction')).toBe(false);
      expect(isTimelineHeader('Features')).toBe(false);
    });
  });

  describe('isComparisonHeader', () => {
    it('should detect comparison headers', () => {
      expect(isComparisonHeader('Comparison')).toBe(true);
      expect(isComparisonHeader('Feature Comparison')).toBe(true);
      expect(isComparisonHeader('Option A vs Option B')).toBe(true);
      expect(isComparisonHeader('A versus B')).toBe(true);
      expect(isComparisonHeader('Compare Options')).toBe(true);
      expect(isComparisonHeader('Alternatives')).toBe(true);
      expect(isComparisonHeader('Available Options')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isComparisonHeader('COMPARISON')).toBe(true);
      expect(isComparisonHeader('Option A VS Option B')).toBe(true);
    });

    it('should not match unrelated headers', () => {
      expect(isComparisonHeader('Introduction')).toBe(false);
      expect(isComparisonHeader('Summary')).toBe(false);
    });
  });

  describe('isMetricsHeader', () => {
    it('should detect metrics headers', () => {
      expect(isMetricsHeader('Key Metrics')).toBe(true);
      expect(isMetricsHeader('KPI Dashboard')).toBe(true);
      expect(isMetricsHeader('Performance Metrics')).toBe(true);
      expect(isMetricsHeader('Benchmarks')).toBe(true);
      expect(isMetricsHeader('Scores')).toBe(true);
      expect(isMetricsHeader('Ratings')).toBe(true);
    });
  });

  describe('isExecutiveSummaryHeader', () => {
    it('should detect executive summary headers', () => {
      expect(isExecutiveSummaryHeader('Executive Summary')).toBe(true);
      expect(isExecutiveSummaryHeader('TL;DR')).toBe(true);
      expect(isExecutiveSummaryHeader('TLDR')).toBe(true);
      expect(isExecutiveSummaryHeader('At a Glance')).toBe(true);
      expect(isExecutiveSummaryHeader('Overview')).toBe(true);
    });
  });

  describe('isActionsHeader', () => {
    it('should detect actions headers', () => {
      expect(isActionsHeader('Recommended Actions')).toBe(true);
      expect(isActionsHeader('Next Steps')).toBe(true);
      expect(isActionsHeader('Action Items')).toBe(true);
      expect(isActionsHeader('Recommendations')).toBe(true);
    });
  });

  describe('isAbstractHeader', () => {
    it('should detect abstract headers', () => {
      expect(isAbstractHeader('Abstract')).toBe(true);
      expect(isAbstractHeader('Research Abstract')).toBe(true);
      expect(isAbstractHeader('Study Abstract')).toBe(true);
    });

    it('should not match partial matches', () => {
      expect(isAbstractHeader('Abstract Art')).toBe(false);
    });
  });
});

describe('Timeline Pattern Detection', () => {
  describe('detectTimelinePattern', () => {
    it('should detect year patterns', () => {
      const result = detectTimelinePattern('2024: Major milestone achieved');
      expect(result).toEqual({
        date: '2024',
        event: 'Major milestone achieved',
      });
    });

    it('should detect month year patterns', () => {
      expect(detectTimelinePattern('Jan 2024: Launch event')).toEqual({
        date: 'Jan 2024',
        event: 'Launch event',
      });

      expect(detectTimelinePattern('January 2024: Full month name')).toEqual({
        date: 'January 2024',
        event: 'Full month name',
      });
    });

    it('should detect quarter patterns', () => {
      expect(detectTimelinePattern('Q1 2024: First quarter')).toEqual({
        date: 'Q1 2024',
        event: 'First quarter',
      });

      expect(detectTimelinePattern('Q4-2024: Hyphenated')).toEqual({
        date: 'Q4-2024',
        event: 'Hyphenated',
      });
    });

    it('should detect ISO date patterns', () => {
      expect(detectTimelinePattern('2024-01-15: Specific date')).toEqual({
        date: '2024-01-15',
        event: 'Specific date',
      });

      expect(detectTimelinePattern('2024-03: Month only')).toEqual({
        date: '2024-03',
        event: 'Month only',
      });
    });

    it('should detect phase/step/stage patterns', () => {
      expect(detectTimelinePattern('Phase 1: Planning')).toEqual({
        date: 'Phase 1',
        event: 'Planning',
      });

      expect(detectTimelinePattern('Step 2: Implementation')).toEqual({
        date: 'Step 2',
        event: 'Implementation',
      });

      expect(detectTimelinePattern('Stage 3: Testing')).toEqual({
        date: 'Stage 3',
        event: 'Testing',
      });
    });

    it('should detect day/week/month number patterns', () => {
      expect(detectTimelinePattern('Day 1: Kickoff')).toEqual({
        date: 'Day 1',
        event: 'Kickoff',
      });

      expect(detectTimelinePattern('Week 4: Review')).toEqual({
        date: 'Week 4',
        event: 'Review',
      });

      expect(detectTimelinePattern('Month 6: Midpoint')).toEqual({
        date: 'Month 6',
        event: 'Midpoint',
      });
    });

    it('should detect date ranges', () => {
      expect(detectTimelinePattern('2023-2024: Multi-year project')).toEqual({
        date: '2023-2024',
        event: 'Multi-year project',
      });
    });

    it('should handle various separators', () => {
      expect(detectTimelinePattern('2024 - Event with dash')).toEqual({
        date: '2024',
        event: 'Event with dash',
      });

      expect(detectTimelinePattern('2024 – Event with en-dash')).toEqual({
        date: '2024',
        event: 'Event with en-dash',
      });
    });

    it('should return null for non-timeline patterns', () => {
      expect(detectTimelinePattern('Regular text')).toBeNull();
      expect(detectTimelinePattern('Some description without date')).toBeNull();
    });
  });
});

describe('Metric Pattern Detection', () => {
  describe('detectMetricBar', () => {
    it('should detect percentage patterns', () => {
      const result = detectMetricBar('Completion Rate: 85%');
      expect(result).toEqual({
        label: 'Completion Rate',
        value: 85,
        suffix: '%',
      });
    });

    it('should detect fraction patterns', () => {
      const result = detectMetricBar('Score: 4.5/5');
      expect(result).toEqual({
        label: 'Score',
        value: 90, // 4.5/5 = 90%
        suffix: '/5',
        max: 5,
      });
    });

    it('should detect rating out of 10', () => {
      const result = detectMetricBar('Rating: 8/10');
      expect(result).toEqual({
        label: 'Rating',
        value: 80,
        suffix: '/10',
        max: 10,
      });
    });

    it('should detect signed percentages', () => {
      const result = detectMetricBar('Growth: +15%');
      expect(result).toEqual({
        label: 'Growth',
        value: 15,
        suffix: '% increase',
      });
    });

    it('should detect decimal percentages', () => {
      const result = detectMetricBar('Accuracy: 92.5%');
      expect(result).toEqual({
        label: 'Accuracy',
        value: 92.5,
        suffix: '%',
      });
    });

    it('should detect word "percent"', () => {
      const result = detectMetricBar('Progress: 75 percent');
      expect(result).toEqual({
        label: 'Progress',
        value: 75,
        suffix: '%',
      });
    });

    it('should return null for values > 1000', () => {
      expect(detectMetricBar('Revenue: 5000')).toBeNull();
    });

    it('should return null for non-metric patterns', () => {
      expect(detectMetricBar('Regular text')).toBeNull();
      expect(detectMetricBar('No metrics here')).toBeNull();
    });
  });
});

describe('Comparison Pattern Detection', () => {
  describe('detectComparisonItem', () => {
    it('should detect option patterns', () => {
      const result = detectComparisonItem('Option A: Best for beginners');
      expect(result).toEqual({
        name: 'Option A',
        description: 'Best for beginners',
      });
    });

    it('should detect plan patterns', () => {
      const result = detectComparisonItem('Plan 1: Basic features');
      expect(result).toEqual({
        name: 'Plan 1',
        description: 'Basic features',
      });
    });

    it('should detect tier patterns', () => {
      const result = detectComparisonItem('Tier Premium: Full access');
      expect(result).toEqual({
        name: 'Tier Premium',
        description: 'Full access',
      });
    });

    it('should return null for non-comparison patterns', () => {
      expect(detectComparisonItem('Regular text')).toBeNull();
      expect(detectComparisonItem('Some description')).toBeNull();
    });
  });
});

describe('Insight Detection', () => {
  describe('isStrategicInsight', () => {
    it('should detect strategic insight patterns', () => {
      expect(isStrategicInsight('Critical insight: This is important')).toBe(true);
      expect(isStrategicInsight('Strategic implication for the industry')).toBe(true);
      expect(isStrategicInsight('AlgoVigilance opportunity identified')).toBe(true);
      expect(isStrategicInsight('Market opportunity exists')).toBe(true);
      expect(isStrategicInsight('Key finding from research')).toBe(true);
      expect(isStrategicInsight('Important: Note this')).toBe(true);
      expect(isStrategicInsight('Note: For reference')).toBe(true);
      expect(isStrategicInsight('**Critical** information')).toBe(true);
    });

    it('should return false for non-insight text', () => {
      expect(isStrategicInsight('Regular paragraph text')).toBe(false);
    });
  });

  describe('isActionItem', () => {
    it('should detect action item patterns', () => {
      expect(isActionItem('Recommend implementing this')).toBe(true);
      expect(isActionItem('Action: Take this step')).toBe(true);
      expect(isActionItem('Next step to consider')).toBe(true);
      expect(isActionItem('Should consider this option')).toBe(true);
      expect(isActionItem('We recommend this approach')).toBe(true);
      expect(isActionItem('Action item to complete')).toBe(true);
    });

    it('should return false for non-action text', () => {
      expect(isActionItem('Regular description')).toBe(false);
    });
  });

  describe('detectInsightVariant', () => {
    it('should detect critical variant', () => {
      expect(detectInsightVariant('Critical issue found')).toBe('critical');
      expect(detectInsightVariant('Warning: Be careful')).toBe('critical');
      expect(detectInsightVariant('Risk assessment needed')).toBe('critical');
    });

    it('should detect opportunity variant', () => {
      expect(detectInsightVariant('Opportunity for growth')).toBe('opportunity');
      expect(detectInsightVariant('Market potential')).toBe('opportunity');
      expect(detectInsightVariant('Growth strategy')).toBe('opportunity');
    });

    it('should detect strategic variant', () => {
      expect(detectInsightVariant('Strategic positioning')).toBe('strategic');
      expect(detectInsightVariant('AlgoVigilance focus area')).toBe('strategic');
      expect(detectInsightVariant('Implication for business')).toBe('strategic');
    });

    it('should return default for generic text', () => {
      expect(detectInsightVariant('Regular insight text')).toBe('default');
    });
  });
});

describe('Utility Functions', () => {
  describe('isPullQuote', () => {
    it('should detect quoted text', () => {
      expect(isPullQuote('"This is a quote"')).toBe(true);
      expect(isPullQuote('"Smart quotes work too"')).toBe(true);
    });

    it('should not match partial quotes', () => {
      expect(isPullQuote('"Only opening')).toBe(false);
      expect(isPullQuote('Only closing"')).toBe(false);
    });
  });

  describe('detectStatPattern', () => {
    it('should detect currency patterns', () => {
      expect(detectStatPattern('$150K annual revenue')).toEqual({
        value: '$150K',
        rest: 'annual revenue',
      });
    });

    it('should detect percentage patterns', () => {
      expect(detectStatPattern('45% growth rate')).toEqual({
        value: '45%',
        rest: 'growth rate',
      });
    });

    it('should detect multiplier patterns', () => {
      expect(detectStatPattern('2.5x increase')).toEqual({
        value: '2.5x',
        rest: 'increase',
      });
    });

    it('should return null for non-stat text', () => {
      expect(detectStatPattern('Regular text here')).toBeNull();
    });
  });

  describe('generateHeadingId', () => {
    it('should convert heading to URL-friendly ID', () => {
      expect(generateHeadingId('Hello World')).toBe('hello-world');
      expect(generateHeadingId('Key Takeaways!')).toBe('key-takeaways');
      expect(generateHeadingId('1. Introduction')).toBe('1-introduction');
    });

    it('should handle special characters', () => {
      expect(generateHeadingId('What\'s New?')).toBe('what-s-new');
      expect(generateHeadingId('A & B')).toBe('a-b');
    });
  });

  describe('detectNumberedHeader', () => {
    it('should detect numbered section headers', () => {
      expect(detectNumberedHeader('1. Introduction')).toEqual({
        number: '1',
        title: 'Introduction',
      });

      expect(detectNumberedHeader('10. Final Section')).toEqual({
        number: '10',
        title: 'Final Section',
      });
    });

    it('should return null for non-numbered headers', () => {
      expect(detectNumberedHeader('Introduction')).toBeNull();
      expect(detectNumberedHeader('1) Using parenthesis')).toBeNull();
    });
  });
});

describe('Table Detection', () => {
  describe('isTableRow', () => {
    it('should detect markdown table rows', () => {
      expect(isTableRow('| Cell 1 | Cell 2 |')).toBe(true);
      expect(isTableRow('| Header | Header |')).toBe(true);
    });

    it('should reject non-table text', () => {
      expect(isTableRow('Regular text')).toBe(false);
      expect(isTableRow('Text with | pipe')).toBe(false);
      expect(isTableRow('| Only start')).toBe(false);
    });
  });

  describe('parseTableRow', () => {
    it('should parse table row into cells', () => {
      expect(parseTableRow('| A | B | C |')).toEqual(['A', 'B', 'C']);
      expect(parseTableRow('| Cell with spaces | Another |')).toEqual(['Cell with spaces', 'Another']);
    });

    it('should filter empty cells', () => {
      expect(parseTableRow('| A |  | C |')).toEqual(['A', 'C']);
    });
  });

  describe('isTableSeparator', () => {
    it('should detect table separator rows', () => {
      expect(isTableSeparator('|---|---|---|')).toBe(true);
      expect(isTableSeparator('| --- | --- |')).toBe(true);
      expect(isTableSeparator('|:---:|:---:|')).toBe(true);
    });

    it('should reject non-separator rows', () => {
      expect(isTableSeparator('| Cell | Cell |')).toBe(false);
      expect(isTableSeparator('Regular text')).toBe(false);
    });
  });
});
