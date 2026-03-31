/**
 * ESLint Rule: no-sequential-awaits
 *
 * Detects sequential await statements that could be executed in parallel.
 * Suggests using Promise.all or fetchAllParallel from lib/parallel-utils.
 *
 * BAD:
 * ```typescript
 * const a = await fetchA();
 * const b = await fetchB();
 * const c = await fetchC();
 * ```
 *
 * GOOD:
 * ```typescript
 * const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()]);
 * // or
 * const results = await fetchAllParallel([
 *   () => fetchA(),
 *   () => fetchB(),
 *   () => fetchC(),
 * ]);
 * ```
 *
 * @module lib/eslint-rules/no-sequential-awaits
 */

import type { Rule } from 'eslint';
import type { Node, Identifier, AwaitExpression, VariableDeclaration } from 'estree';

interface AwaitInfo {
  node: AwaitExpression;
  declarationNode: VariableDeclaration | null;
  variableName: string | null;
  usedIdentifiers: Set<string>;
  loc: { line: number; column: number };
}

/**
 * Extract all identifiers used within an AST node
 * Uses a visited set to prevent circular reference issues
 */
function getUsedIdentifiers(node: Node): Set<string> {
  const identifiers = new Set<string>();
  const visited = new WeakSet<object>();

  function traverse(n: Node | null): void {
    if (!n || typeof n !== 'object') return;

    // Prevent circular reference traversal
    if (visited.has(n)) return;
    visited.add(n);

    if (n.type === 'Identifier') {
      identifiers.add((n as Identifier).name);
      return;
    }

    // Only traverse known AST child properties to avoid parent references
    const childProps = [
      'argument', 'arguments', 'body', 'callee', 'consequent', 'alternate',
      'init', 'test', 'update', 'left', 'right', 'object', 'property',
      'elements', 'properties', 'value', 'key', 'expression', 'expressions',
      'declarations', 'params', 'id', 'computed', 'tag', 'quasi', 'quasis'
    ];

    for (const prop of childProps) {
      const value = (n as Record<string, unknown>)[prop];
      if (!value) continue;

      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === 'object' && 'type' in item) {
            traverse(item as Node);
          }
        }
      } else if (typeof value === 'object' && 'type' in value) {
        traverse(value as Node);
      }
    }
  }

  traverse(node);
  return identifiers;
}

/**
 * Check if an await expression depends on a variable
 */
function dependsOn(awaitInfo: AwaitInfo, variableName: string): boolean {
  return awaitInfo.usedIdentifiers.has(variableName);
}

/**
 * Find groups of sequential awaits that could be parallelized
 */
function findParallelizableGroups(awaits: AwaitInfo[]): AwaitInfo[][] {
  const groups: AwaitInfo[][] = [];
  let currentGroup: AwaitInfo[] = [];
  const definedVariables = new Set<string>();

  for (const awaitInfo of awaits) {
    // Check if this await depends on any variable defined in the current group
    const dependsOnGroupVar = [...currentGroup].some(
      (prev) => prev.variableName && dependsOn(awaitInfo, prev.variableName)
    );

    if (dependsOnGroupVar) {
      // This await depends on a previous one, start a new group
      if (currentGroup.length >= 2) {
        groups.push(currentGroup);
      }
      // Add all variables from current group to defined set
      currentGroup.forEach((a) => {
        if (a.variableName) definedVariables.add(a.variableName);
      });
      currentGroup = [awaitInfo];
    } else {
      // Independent await, add to current group
      currentGroup.push(awaitInfo);
    }
  }

  // Don't forget the last group
  if (currentGroup.length >= 2) {
    groups.push(currentGroup);
  }

  return groups;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Detect sequential await statements that could be parallelized',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/nexvigilant/studio/blob/main/docs/rules/no-sequential-awaits.md',
    },
    fixable: undefined, // Auto-fix is complex for this rule
    hasSuggestions: true,
    messages: {
      sequentialAwaits:
        '{{count}} sequential awaits detected that could be parallelized. Consider using Promise.all() or fetchAllParallel() from @/lib/parallel-utils.',
      usePromiseAll:
        'Replace sequential awaits with Promise.all() for better performance.',
      useFetchAllParallel:
        'Replace sequential awaits with fetchAllParallel() for better error handling.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          minSequential: {
            type: 'integer',
            minimum: 2,
            default: 2,
          },
          ignoredPatterns: {
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
    const minSequential = options.minSequential || 2;
    const ignoredPatterns = (options.ignoredPatterns || []).map(
      (p: string) => new RegExp(p)
    );

    // Track awaits within each function/block scope
    const scopeStack: AwaitInfo[][] = [];

    function enterScope() {
      scopeStack.push([]);
    }

    function exitScope() {
      const awaits = scopeStack.pop();
      if (!awaits || awaits.length < minSequential) return;

      // Find groups of parallelizable awaits
      const groups = findParallelizableGroups(awaits);

      for (const group of groups) {
        if (group.length < minSequential) continue;

        // Check if any await matches ignored patterns
        const shouldIgnore = group.some((a) =>
          ignoredPatterns.some((pattern: RegExp) =>
            pattern.test(context.sourceCode.getText(a.node as unknown as Parameters<typeof context.sourceCode.getText>[0]))
          )
        );

        if (shouldIgnore) continue;

        // Report the issue on the first await of the group
        context.report({
          node: group[0].node as unknown as Parameters<typeof context.report>[0]['node'],
          messageId: 'sequentialAwaits',
          data: {
            count: String(group.length),
          },
          suggest: [
            {
              messageId: 'usePromiseAll',
              fix: null, // Complex transformation, manual fix preferred
            },
            {
              messageId: 'useFetchAllParallel',
              fix: null,
            },
          ],
        });
      }
    }

    return {
      // Track function scopes
      FunctionDeclaration: enterScope,
      'FunctionDeclaration:exit': exitScope,
      FunctionExpression: enterScope,
      'FunctionExpression:exit': exitScope,
      ArrowFunctionExpression: enterScope,
      'ArrowFunctionExpression:exit': exitScope,

      // Track await expressions
      AwaitExpression(node: AwaitExpression) {
        if (scopeStack.length === 0) return;

        const currentScope = scopeStack[scopeStack.length - 1];

        // Get the parent to check if it's a variable declaration
        const ancestors = context.sourceCode.getAncestors(node as unknown as Parameters<typeof context.sourceCode.getAncestors>[0]);
        const parent = ancestors[ancestors.length - 1];
        const grandparent = ancestors[ancestors.length - 2];

        let variableName: string | null = null;
        let declarationNode: VariableDeclaration | null = null;

        // Check if await is in a variable declaration
        if (
          parent &&
          parent.type === 'VariableDeclarator' &&
          'id' in parent &&
          parent.id.type === 'Identifier'
        ) {
          variableName = parent.id.name;
          if (grandparent && grandparent.type === 'VariableDeclaration') {
            declarationNode = grandparent as VariableDeclaration;
          }
        }

        // Get all identifiers used in the await expression's argument
        const usedIdentifiers = getUsedIdentifiers(node.argument as Node);

        currentScope.push({
          node,
          declarationNode,
          variableName,
          usedIdentifiers,
          loc: node.loc?.start || { line: 0, column: 0 },
        });
      },
    };
  },
};

export default rule;

// Named export for ESLint plugin structure
export const rules = {
  'no-sequential-awaits': rule,
};
