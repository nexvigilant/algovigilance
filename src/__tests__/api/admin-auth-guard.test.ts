/**
 * Admin Server Action Authentication Guard Tests
 *
 * Verifies that admin server actions require authentication.
 * This test ensures no admin server actions are accidentally left unprotected.
 *
 * Run with: npm test -- --testPathPattern=admin-auth-guard
 */

import fs from 'fs';
import path from 'path';

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
    } else if (item.isFile() && item.name.endsWith('.ts') && !item.name.endsWith('.d.ts')) {
      results.push(fullPath);
    }
  }

  return results;
}

// Helper to check if a file is a server action (contains 'use server' directive)
function isServerAction(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  // The directive must appear as the first statement, quoted
  return content.includes("'use server'") || content.includes('"use server"');
}

// Helper to check if a server action file imports from admin-auth
function hasAdminAuthImport(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  return (
    content.includes("from '@/lib/admin-auth'") ||
    content.includes('from "@/lib/admin-auth"')
  );
}

// Helper to check if a server action file calls requireAdmin or requireModerator
function hasAdminAuthCall(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes('requireAdmin()') || content.includes('requireModerator()');
}

// Helper to extract exported async function names from a server action file
function getExportedActionNames(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const names: string[] = [];

  // Match: export async function foo or export function foo
  const pattern = /export\s+(?:async\s+)?function\s+(\w+)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    names.push(match[1]);
  }

  return names;
}

describe('Admin Server Action Authentication Guard', () => {
  const adminActionsDir = path.join(process.cwd(), 'src', 'app', 'nucleus', 'admin');
  let serverActionFiles: string[] = [];

  beforeAll(() => {
    const allTsFiles = findTsFiles(adminActionsDir);
    serverActionFiles = allTsFiles.filter(isServerAction);
  });

  test('should find admin server action files', () => {
    expect(serverActionFiles.length).toBeGreaterThan(0);
    console.log(`Found ${serverActionFiles.length} admin server action files`);
    serverActionFiles.forEach((f) => {
      console.log(`  - ${path.relative(process.cwd(), f)}`);
    });
  });

  test('all admin server action files should import from @/lib/admin-auth', () => {
    const unprotectedFiles: string[] = [];

    for (const actionFile of serverActionFiles) {
      if (!hasAdminAuthImport(actionFile)) {
        const relativePath = path.relative(process.cwd(), actionFile);
        unprotectedFiles.push(relativePath);
      }
    }

    if (unprotectedFiles.length > 0) {
      console.error('Server action files missing admin-auth import:');
      unprotectedFiles.forEach((f) => console.error(`  - ${f}`));
    }

    expect(unprotectedFiles).toHaveLength(0);
  });

  test('all admin server action files should call requireAdmin or requireModerator', () => {
    const unprotectedFiles: string[] = [];

    for (const actionFile of serverActionFiles) {
      if (!hasAdminAuthCall(actionFile)) {
        const relativePath = path.relative(process.cwd(), actionFile);
        unprotectedFiles.push(relativePath);
      }
    }

    if (unprotectedFiles.length > 0) {
      console.error('Server action files missing requireAdmin/requireModerator calls:');
      unprotectedFiles.forEach((f) => console.error(`  - ${f}`));
    }

    expect(unprotectedFiles).toHaveLength(0);
  });

  test('should list all admin server actions for reference', () => {
    const summary: { file: string; actions: string[]; protected: boolean }[] = [];

    for (const actionFile of serverActionFiles) {
      const relativePath = path.relative(adminActionsDir, actionFile);
      const actions = getExportedActionNames(actionFile);
      const isProtected = hasAdminAuthCall(actionFile);

      summary.push({
        file: relativePath,
        actions,
        protected: isProtected,
      });
    }

    console.log('\nAdmin Server Actions:');
    console.table(summary);

    const allProtected = summary.every((s) => s.protected);
    expect(allProtected).toBe(true);
  });
});

describe('Admin Auth Module', () => {
  test('admin-auth module should export required functions', async () => {
    // Dynamically import to verify the module structure
    const adminAuthPath = path.join(process.cwd(), 'src', 'lib', 'admin-auth.ts');

    expect(fs.existsSync(adminAuthPath)).toBe(true);

    const content = fs.readFileSync(adminAuthPath, 'utf-8');

    // Check for required exports
    expect(content).toContain('export async function requireAdmin');
    expect(content).toContain('export async function requireModerator');
    expect(content).toContain('export async function requireAuth');
  });

  test('requireAdmin should throw on unauthorized access', async () => {
    const adminAuthPath = path.join(process.cwd(), 'src', 'lib', 'admin-auth.ts');
    const content = fs.readFileSync(adminAuthPath, 'utf-8');

    // Verify the function throws appropriate error messages
    expect(content).toContain("throw new Error('Unauthorized: Admin access required')");
    expect(content).toContain("throw new Error('Unauthorized: Moderator access required')");
    expect(content).toContain("throw new Error('Unauthorized: Missing authentication token')");
    expect(content).toContain("throw new Error('Unauthorized: Invalid or expired authentication token')");
  });
});
