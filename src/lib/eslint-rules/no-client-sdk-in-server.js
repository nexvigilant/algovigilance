/**
 * ESLint Rule: no-client-sdk-in-server
 *
 * Detects imports of Firebase client SDK in server action files.
 * Server actions should use firebase-admin SDK to bypass security rules
 * and avoid permission errors.
 *
 * Server action files are identified by:
 * - Files with 'use server' directive
 * - Files in paths containing /actions/
 * - Files with -actions.ts or .actions.ts suffix
 *
 * Detected patterns:
 * - import { db } from '@/lib/firebase'
 * - import { ... } from 'firebase/firestore'
 * - import { ... } from 'firebase/auth'
 *
 * Migration: Run `npx tsx scripts/migrate-sdk.ts --scan` to find all violations
 *            Run `npx tsx scripts/migrate-sdk.ts <file>` to auto-migrate
 *
 * @module lib/eslint-rules/no-client-sdk-in-server
 */

/**
 * Check if file path indicates a server-side file
 * @param {string} filePath
 * @returns {boolean}
 */
function isServerFilePath(filePath) {
  if (!filePath) return false;

  // Common server action patterns
  const serverPatterns = [
    /\/actions\//,
    /\/actions\.ts$/,
    /-actions\.ts$/,
    /\.server\.ts$/,
    /\/server\//,
  ];

  return serverPatterns.some((pattern) => pattern.test(filePath));
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow Firebase client SDK imports in server action files',
      category: 'Possible Errors',
      recommended: true,
      url: 'https://github.com/nexvigilant/studio/blob/main/docs/rules/no-client-sdk-in-server.md',
    },
    fixable: undefined,
    hasSuggestions: true,
    messages: {
      clientSdkInServer:
        "Import from '@/lib/firebase' (client SDK) detected in server action file. Use '@/lib/firebase-admin' instead to avoid permission errors.",
      clientSdkAuthInServer:
        "Import of 'auth' from '@/lib/firebase' detected. Use authentication via session tokens or Firebase Admin SDK's 'adminAuth' instead.",
      clientSdkDbInServer:
        "Import of 'db' from '@/lib/firebase' detected. Use 'adminDb' from '@/lib/firebase-admin' instead.",
      firestoreClientInServer:
        "Import from 'firebase/firestore' (client SDK) detected in server action. Use Admin SDK patterns: adminDb.collection().doc().get() instead of getDocs/getDoc/collection/doc.",
      authClientInServer:
        "Import from 'firebase/auth' detected in server action. Use 'adminAuth' from '@/lib/firebase-admin' for server-side auth operations.",
      suggestAdminImport:
        "Replace with import from '@/lib/firebase-admin'",
    },
    schema: [
      {
        type: 'object',
        properties: {
          // Allow disabling for specific files that legitimately need client SDK
          allowedFiles: {
            type: 'array',
            items: { type: 'string' },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const allowedFiles = (options.allowedFiles || []).map(
      (pattern) => new RegExp(pattern)
    );

    let hasUseServerDirective = false;
    let isServerPath = false;
    const filePath = context.filename || context.getFilename?.() || '';

    // Check if file path indicates server context
    isServerPath = isServerFilePath(filePath);

    // Check if file is in allowlist
    const isAllowed = allowedFiles.some((pattern) => pattern.test(filePath));
    if (isAllowed) {
      return {};
    }

    return {
      // Check for 'use server' directive
      Program(node) {
        const firstStatement = node.body[0];

        if (
          firstStatement &&
          firstStatement.type === 'ExpressionStatement' &&
          firstStatement.expression.type === 'Literal' &&
          firstStatement.expression.value === 'use server'
        ) {
          hasUseServerDirective = true;
        }
      },

      // Check imports
      ImportDeclaration(node) {
        // Only check if this is a server action file
        if (!hasUseServerDirective && !isServerPath) {
          return;
        }

        const source = node.source.value;

        // Check for client Firebase SDK imports
        if (source === '@/lib/firebase' || source === '../../../lib/firebase' || source.endsWith('/lib/firebase')) {
          const importedNames = node.specifiers
            .filter((spec) => spec.type === 'ImportSpecifier')
            .map((spec) => spec.imported.name);

          // Specific warnings for common imports
          if (importedNames.includes('auth')) {
            context.report({
              node,
              messageId: 'clientSdkAuthInServer',
              suggest: [
                {
                  messageId: 'suggestAdminImport',
                  fix(fixer) {
                    return fixer.replaceText(node.source, "'@/lib/firebase-admin'");
                  },
                },
              ],
            });
          } else if (importedNames.includes('db')) {
            context.report({
              node,
              messageId: 'clientSdkDbInServer',
              suggest: [
                {
                  messageId: 'suggestAdminImport',
                  fix(fixer) {
                    return fixer.replaceText(node.source, "'@/lib/firebase-admin'");
                  },
                },
              ],
            });
          } else {
            context.report({
              node,
              messageId: 'clientSdkInServer',
              suggest: [
                {
                  messageId: 'suggestAdminImport',
                  fix(fixer) {
                    return fixer.replaceText(node.source, "'@/lib/firebase-admin'");
                  },
                },
              ],
            });
          }
        }

        // Check for firebase/firestore imports (client SDK functions)
        // Allow type-only imports (e.g., import type { Timestamp })
        if (source === 'firebase/firestore') {
          const isTypeOnlyImport = node.importKind === 'type';
          if (!isTypeOnlyImport) {
            context.report({
              node,
              messageId: 'firestoreClientInServer',
              // No auto-fix: Complex transformation requires codemod
              // Run: npx tsx scripts/migrate-sdk.ts <file>
            });
          }
        }

        // Check for firebase/auth imports
        if (source === 'firebase/auth') {
          context.report({
            node,
            messageId: 'authClientInServer',
            suggest: [
              {
                messageId: 'suggestAdminImport',
                fix(fixer) {
                  return fixer.replaceText(node.source, "'@/lib/firebase-admin'");
                },
              },
            ],
          });
        }
      },
    };
  },
};

module.exports = rule;
module.exports.default = rule;
