/**
 * Community Constants Unit Tests
 *
 * Tests reputation system, badge definitions, and helper functions.
 * Pure function testing - no Firebase dependencies.
 */

import { describe, it, expect } from '@jest/globals';
import {
  REPUTATION_POINTS,
  REPUTATION_LEVELS,
  REACTION_TYPES,
  BADGES,
  RARITY_COLORS,
  getReputationLevel,
  getBadgeById,
  getBadgesByCategory,
  getBadgesByRarity,
} from '@/lib/community-constants';

describe('Community Constants', () => {
  describe('REPUTATION_POINTS', () => {
    it('should have positive points for content creation', () => {
      expect(REPUTATION_POINTS.CREATE_POST).toBeGreaterThan(0);
      expect(REPUTATION_POINTS.CREATE_REPLY).toBeGreaterThan(0);
    });

    it('should reward upvotes more than reactions', () => {
      expect(REPUTATION_POINTS.RECEIVE_UPVOTE_POST).toBeGreaterThan(
        REPUTATION_POINTS.RECEIVE_REACTION
      );
    });

    it('should have negative points for downvotes', () => {
      expect(REPUTATION_POINTS.RECEIVE_DOWNVOTE_POST).toBeLessThan(0);
      expect(REPUTATION_POINTS.RECEIVE_DOWNVOTE_REPLY).toBeLessThan(0);
    });

    it('should have highest reward for accepted answers', () => {
      expect(REPUTATION_POINTS.ACCEPTED_ANSWER).toBeGreaterThan(
        REPUTATION_POINTS.CREATE_POST
      );
      expect(REPUTATION_POINTS.ACCEPTED_ANSWER).toBeGreaterThan(
        REPUTATION_POINTS.RECEIVE_UPVOTE_POST
      );
    });

    it('should have small reward for daily login', () => {
      expect(REPUTATION_POINTS.DAILY_LOGIN).toBe(1);
    });
  });

  describe('REPUTATION_LEVELS', () => {
    it('should have 7 levels', () => {
      expect(REPUTATION_LEVELS).toHaveLength(7);
    });

    it('should start at level 1 with 0 points', () => {
      expect(REPUTATION_LEVELS[0].level).toBe(1);
      expect(REPUTATION_LEVELS[0].minPoints).toBe(0);
    });

    it('should have increasing point requirements', () => {
      for (let i = 1; i < REPUTATION_LEVELS.length; i++) {
        expect(REPUTATION_LEVELS[i].minPoints).toBeGreaterThan(
          REPUTATION_LEVELS[i - 1].minPoints
        );
      }
    });

    it('should have increasing level numbers', () => {
      for (let i = 1; i < REPUTATION_LEVELS.length; i++) {
        expect(REPUTATION_LEVELS[i].level).toBe(REPUTATION_LEVELS[i - 1].level + 1);
      }
    });

    it('should have unique names', () => {
      const names = REPUTATION_LEVELS.map((l) => l.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have colors in hex format', () => {
      REPUTATION_LEVELS.forEach((level) => {
        expect(level.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe('getReputationLevel', () => {
    it('should return level 1 for 0 points', () => {
      const level = getReputationLevel(0);
      expect(level.level).toBe(1);
      expect(level.name).toBe('Newcomer');
    });

    it('should return level 1 for negative points', () => {
      const level = getReputationLevel(-100);
      expect(level.level).toBe(1);
    });

    it('should return level 2 at 50 points', () => {
      const level = getReputationLevel(50);
      expect(level.level).toBe(2);
      expect(level.name).toBe('Contributor');
    });

    it('should return correct level for boundary values', () => {
      expect(getReputationLevel(49).level).toBe(1);
      expect(getReputationLevel(50).level).toBe(2);
      expect(getReputationLevel(199).level).toBe(2);
      expect(getReputationLevel(200).level).toBe(3);
    });

    it('should return highest level for very high points', () => {
      const level = getReputationLevel(10000);
      expect(level.level).toBe(7);
      expect(level.name).toBe('Legend');
    });

    it('should return level info with all properties', () => {
      const level = getReputationLevel(100);
      expect(level).toHaveProperty('level');
      expect(level).toHaveProperty('name');
      expect(level).toHaveProperty('minPoints');
      expect(level).toHaveProperty('color');
    });
  });

  describe('REACTION_TYPES', () => {
    it('should have 5 reaction types', () => {
      expect(Object.keys(REACTION_TYPES)).toHaveLength(5);
    });

    it('should include standard reactions', () => {
      expect(REACTION_TYPES).toHaveProperty('like');
      expect(REACTION_TYPES).toHaveProperty('love');
      expect(REACTION_TYPES).toHaveProperty('insightful');
      expect(REACTION_TYPES).toHaveProperty('helpful');
      expect(REACTION_TYPES).toHaveProperty('celebrate');
    });

    it('should have emoji and label for each reaction', () => {
      Object.values(REACTION_TYPES).forEach((reaction) => {
        expect(reaction).toHaveProperty('id');
        expect(reaction).toHaveProperty('emoji');
        expect(reaction).toHaveProperty('label');
        expect(reaction).toHaveProperty('color');
      });
    });

    it('should have colors in hex format', () => {
      Object.values(REACTION_TYPES).forEach((reaction) => {
        expect(reaction.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe('BADGES', () => {
    it('should have at least 15 badges', () => {
      expect(BADGES.length).toBeGreaterThanOrEqual(15);
    });

    it('should have unique badge IDs', () => {
      const ids = BADGES.map((b) => b.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required properties', () => {
      BADGES.forEach((badge) => {
        expect(badge).toHaveProperty('id');
        expect(badge).toHaveProperty('name');
        expect(badge).toHaveProperty('description');
        expect(badge).toHaveProperty('icon');
        expect(badge).toHaveProperty('category');
        expect(badge).toHaveProperty('requirement');
        expect(badge).toHaveProperty('rarity');
      });
    });

    it('should have badges in all categories', () => {
      const categories = new Set(BADGES.map((b) => b.category));
      expect(categories.has('participation')).toBe(true);
      expect(categories.has('quality')).toBe(true);
      expect(categories.has('milestone')).toBe(true);
      expect(categories.has('special')).toBe(true);
    });

    it('should have badges of all rarities', () => {
      const rarities = new Set(BADGES.map((b) => b.rarity));
      expect(rarities.has('common')).toBe(true);
      expect(rarities.has('uncommon')).toBe(true);
      expect(rarities.has('rare')).toBe(true);
      expect(rarities.has('epic')).toBe(true);
      expect(rarities.has('legendary')).toBe(true);
    });
  });

  describe('getBadgeById', () => {
    it('should return badge by ID', () => {
      const badge = getBadgeById('first-post');
      expect(badge).toBeDefined();
      expect(badge?.name).toBe('First Post');
    });

    it('should return undefined for non-existent badge', () => {
      const badge = getBadgeById('non-existent-badge');
      expect(badge).toBeUndefined();
    });

    it('should return badge with all properties', () => {
      const badge = getBadgeById('trusted-member');
      expect(badge).toBeDefined();
      expect(badge?.id).toBe('trusted-member');
      expect(badge?.category).toBe('milestone');
      expect(badge?.rarity).toBe('uncommon');
    });
  });

  describe('getBadgesByCategory', () => {
    it('should return all participation badges', () => {
      const badges = getBadgesByCategory('participation');
      expect(badges.length).toBeGreaterThan(0);
      badges.forEach((badge) => {
        expect(badge.category).toBe('participation');
      });
    });

    it('should return all quality badges', () => {
      const badges = getBadgesByCategory('quality');
      expect(badges.length).toBeGreaterThan(0);
      badges.forEach((badge) => {
        expect(badge.category).toBe('quality');
      });
    });

    it('should return all milestone badges', () => {
      const badges = getBadgesByCategory('milestone');
      expect(badges.length).toBeGreaterThan(0);
      badges.forEach((badge) => {
        expect(badge.category).toBe('milestone');
      });
    });

    it('should return empty array for invalid category', () => {
      const badges = getBadgesByCategory('invalid' as never);
      expect(badges).toHaveLength(0);
    });
  });

  describe('getBadgesByRarity', () => {
    it('should return all common badges', () => {
      const badges = getBadgesByRarity('common');
      expect(badges.length).toBeGreaterThan(0);
      badges.forEach((badge) => {
        expect(badge.rarity).toBe('common');
      });
    });

    it('should return all legendary badges', () => {
      const badges = getBadgesByRarity('legendary');
      expect(badges.length).toBeGreaterThan(0);
      badges.forEach((badge) => {
        expect(badge.rarity).toBe('legendary');
      });
    });

    it('should return empty array for invalid rarity', () => {
      const badges = getBadgesByRarity('mythic' as never);
      expect(badges).toHaveLength(0);
    });
  });

  describe('RARITY_COLORS', () => {
    it('should have 5 rarity levels', () => {
      expect(Object.keys(RARITY_COLORS)).toHaveLength(5);
    });

    it('should have all standard rarities', () => {
      expect(RARITY_COLORS).toHaveProperty('common');
      expect(RARITY_COLORS).toHaveProperty('uncommon');
      expect(RARITY_COLORS).toHaveProperty('rare');
      expect(RARITY_COLORS).toHaveProperty('epic');
      expect(RARITY_COLORS).toHaveProperty('legendary');
    });

    it('should have colors in hex format', () => {
      Object.values(RARITY_COLORS).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });
});

describe('Reputation System Integration', () => {
  describe('Points progression', () => {
    it('should require reasonable activity to level up', () => {
      // Calculate posts needed to reach level 2 (50 points)
      const postsForLevel2 = Math.ceil(50 / REPUTATION_POINTS.CREATE_POST);
      expect(postsForLevel2).toBe(10);
    });

    it('should reward quality over quantity', () => {
      // Same effort: 10 accepted answers vs 10 regular posts + 40 replies
      // Quality (accepted answers) should yield more reputation
      const qualityPoints = 10 * REPUTATION_POINTS.ACCEPTED_ANSWER;
      const quantityPoints =
        10 * REPUTATION_POINTS.CREATE_POST + 40 * REPUTATION_POINTS.CREATE_REPLY;
      expect(qualityPoints).toBeGreaterThan(quantityPoints);
    });
  });

  describe('Badge requirements', () => {
    it('should have achievable first badges', () => {
      const firstPost = getBadgeById('first-post');
      const firstReply = getBadgeById('first-reply');
      expect(firstPost?.requirement.count).toBe(1);
      expect(firstReply?.requirement.count).toBe(1);
    });

    it('should have progressive milestone badges', () => {
      const milestones = getBadgesByCategory('milestone');
      const reputationBadges = milestones.filter(
        (b) => b.requirement.type === 'reputation'
      );

      // Sort by requirement
      reputationBadges.sort((a, b) => a.requirement.count - b.requirement.count);

      // Each badge should require more reputation than the previous
      for (let i = 1; i < reputationBadges.length; i++) {
        expect(reputationBadges[i].requirement.count).toBeGreaterThan(
          reputationBadges[i - 1].requirement.count
        );
      }
    });
  });
});
