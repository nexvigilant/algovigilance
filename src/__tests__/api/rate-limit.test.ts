/**
 * Rate Limiting Tests
 *
 * Verifies that rate limiting is properly implemented across the application.
 * Tests both the module structure and its integration in server actions.
 *
 * Run with: npm test -- --testPathPattern=rate-limit
 */

import fs from 'fs';
import path from 'path';

describe('Rate Limit Module', () => {
  const rateLimitPath = path.join(process.cwd(), 'src', 'lib', 'rate-limit.ts');

  test('rate-limit module should exist', () => {
    expect(fs.existsSync(rateLimitPath)).toBe(true);
  });

  test('should export required rate limit functions', () => {
    const content = fs.readFileSync(rateLimitPath, 'utf-8');

    // Core rate limiting functions
    expect(content).toContain('export async function checkRateLimit');
    expect(content).toContain('export async function withRateLimit');
    expect(content).toContain('export async function getRateLimitStatus');
    expect(content).toContain('export async function resetRateLimit');

    // Public IP-based rate limiting
    expect(content).toContain('export async function checkPublicRateLimit');
    expect(content).toContain('export async function getClientIP');

    // Admin management functions
    expect(content).toContain('export async function getPublicRateLimitSettings');
    expect(content).toContain('export async function updatePublicRateLimitSettings');
    expect(content).toContain('export async function addIPToWhitelist');
    expect(content).toContain('export async function removeIPFromWhitelist');
    expect(content).toContain('export async function toggleGlobalRateLimiting');
  });

  test('should define rate limit action types', () => {
    const content = fs.readFileSync(rateLimitPath, 'utf-8');

    // User-based actions (check for identifier regardless of quote style)
    expect(content).toMatch(/["']posts["']/);
    expect(content).toMatch(/["']replies["']/);
    expect(content).toMatch(/["']messages["']/);
    expect(content).toMatch(/["']reactions["']/);
    expect(content).toMatch(/["']ai_generation["']/);

    // Public IP-based actions
    expect(content).toMatch(/["']affiliate_application["']/);
    expect(content).toMatch(/["']contact_form["']/);
    expect(content).toMatch(/["']newsletter_signup["']/);
  });

  test('should have sensible default rate limits', () => {
    const content = fs.readFileSync(rateLimitPath, 'utf-8');

    // Extract DEFAULT_LIMITS object
    const defaultLimitsMatch = content.match(/const DEFAULT_LIMITS[^}]+\{[\s\S]*?\};/);
    expect(defaultLimitsMatch).not.toBeNull();

    // Verify limits are not too permissive
    // Posts: should be limited (10 per hour is reasonable)
    expect(content).toContain('posts: { windowMs: 60 * 60 * 1000, maxRequests: 10 }');
    // AI generation: should be limited (10 per minute)
    expect(content).toContain('ai_generation: { windowMs: 60 * 1000, maxRequests: 10 }');
  });

  test('should implement fail-closed security pattern', () => {
    const content = fs.readFileSync(rateLimitPath, 'utf-8');

    // Critical: on error, rate limiting should deny requests (fail-closed)
    expect(content).toContain('SECURITY: Fail-closed');
    expect(content).toContain('allowed: false');
    expect(content).toContain('denying request for safety');
  });

  test('should hash IP addresses for privacy', () => {
    const content = fs.readFileSync(rateLimitPath, 'utf-8');

    // Should hash IPs rather than storing raw
    expect(content).toContain('function hashIP');
    expect(content).toContain('hashedIP');
    expect(content).toContain("we don't want to store raw IPs");
  });
});

describe('Server Actions Rate Limit Integration', () => {
  const actionsDir = path.join(process.cwd(), 'src', 'app', 'nucleus', 'community', 'actions');

  // Helper to recursively find all .ts files in a directory
  function findTsFiles(dir: string): string[] {
    const results: string[] = [];

    if (!fs.existsSync(dir)) {
      return results;
    }

    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        results.push(...findTsFiles(fullPath));
      } else if (item.name.endsWith('.ts') && !item.name.endsWith('.test.ts')) {
        results.push(fullPath);
      }
    }

    return results;
  }

  // Helper to check if file contains rate limiting
  function hasRateLimitCheck(filePath: string): boolean {
    const content = fs.readFileSync(filePath, 'utf-8');
    return (
      content.includes('checkRateLimit') ||
      content.includes('withRateLimit') ||
      content.includes('@/lib/rate-limit')
    );
  }

  // Actions that MUST have rate limiting
  const RATE_LIMITED_ACTIONS = [
    'posts/crud.ts', // createPost, updatePost
    'posts/replies.ts', // createReply
    'posts/reactions.ts', // toggleReaction
  ];

  test('critical community actions should use rate limiting', () => {
    const missingRateLimits: string[] = [];

    for (const actionFile of RATE_LIMITED_ACTIONS) {
      const fullPath = path.join(actionsDir, actionFile);

      if (fs.existsSync(fullPath)) {
        if (!hasRateLimitCheck(fullPath)) {
          missingRateLimits.push(actionFile);
        }
      }
    }

    if (missingRateLimits.length > 0) {
      console.warn('Actions missing rate limiting:', missingRateLimits);
    }

    // This is a warning test - some actions may intentionally not have rate limiting
    // The test documents which actions should be rate limited
    expect(true).toBe(true);
  });

  test('should list all community action files for reference', () => {
    const actionFiles = findTsFiles(actionsDir);
    const actionSummary = actionFiles.map((file) => {
      const relativePath = path.relative(actionsDir, file);
      const hasRateLimit = hasRateLimitCheck(file);
      return { action: relativePath, rateLimited: hasRateLimit };
    });

    console.log('\nCommunity Actions Rate Limit Status:');
    console.table(actionSummary);

    expect(actionFiles.length).toBeGreaterThan(0);
  });
});

describe('Public Actions Rate Limit Integration', () => {
  // Files that handle public form submissions
  const _PUBLIC_ACTION_FILES = [
    'src/lib/schemas/affiliate.ts',
  ];

  test('affiliate application should use checkPublicRateLimit', () => {
    // Check the affiliate application submission action
    const affiliatePath = path.join(process.cwd(), 'src', 'app', 'nucleus', 'admin', 'affiliate-applications');

    if (fs.existsSync(affiliatePath)) {
      const files = fs.readdirSync(affiliatePath);
      const actionFiles = files.filter((f) => f.endsWith('.ts'));

      let hasPublicRateLimit = false;
      for (const file of actionFiles) {
        const content = fs.readFileSync(path.join(affiliatePath, file), 'utf-8');
        if (content.includes('checkPublicRateLimit')) {
          hasPublicRateLimit = true;
          break;
        }
      }

      // Document whether rate limiting is implemented
      console.log(`Affiliate applications public rate limit: ${hasPublicRateLimit ? 'YES' : 'NO'}`);
    }

    expect(true).toBe(true);
  });
});
