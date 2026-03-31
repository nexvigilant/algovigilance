/**
 * ESLint Rule: no-sequential-awaits
 *
 * Detects sequential await statements that could be executed in parallel.
 * Suggests using Promise.all or fetchAllParallel from lib/parallel-utils.
 *
 * @module lib/eslint-rules/no-sequential-awaits
 */

/**
 * Extract all identifiers used within an AST node
 * Uses a visited set to prevent circular reference issues
 * @param {import('estree').Node} node
 * @returns {Set<string>}
 */
function getUsedIdentifiers(node) {
  const identifiers = new Set();
  const visited = new WeakSet();

  function traverse(n) {
    if (!n || typeof n !== 'object') return;

    // Prevent circular reference traversal
    if (visited.has(n)) return;
    visited.add(n);

    if (n.type === 'Identifier') {
      identifiers.add(n.name);
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
      const value = n[prop];
      if (!value) continue;

      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === 'object' && item.type) {
            traverse(item);
          }
        }
      } else if (typeof value === 'object' && value.type) {
        traverse(value);
      }
    }
  }

  traverse(node);
  return identifiers;
}

/**
 * Check if an await expression depends on a variable
 * @param {{ usedIdentifiers: Set<string> }} awaitInfo
 * @param {string} variableName
 * @returns {boolean}
 */
function dependsOn(awaitInfo, variableName) {
  return awaitInfo.usedIdentifiers.has(variableName);
}

/**
 * Find groups of sequential awaits that could be parallelized
 * @param {Array<{ node: import('estree').AwaitExpression, variableName: string | null, usedIdentifiers: Set<string> }>} awaits
 * @returns {Array<Array<{ node: import('estree').AwaitExpression, variableName: string | null, usedIdentifiers: Set<string> }>>}
 */
function findParallelizableGroups(awaits) {
  const groups = [];
  let currentGroup = [];

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

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Detect sequential await statements that could be parallelized',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/nexvigilant/studio/blob/main/docs/rules/no-sequential-awaits.md',
    },
    fixable: undefined,
    hasSuggestions: false,
    messages: {
      sequentialAwaits:
        '{{count}} sequential awaits detected that could be parallelized. Consider using Promise.all() or fetchAllParallel() from @/lib/parallel-utils.',
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
      (p) => new RegExp(p)
    );

    // Track awaits within each function/block scope
    /** @type {Array<Array<{ node: import('estree').AwaitExpression, variableName: string | null, usedIdentifiers: Set<string>, loc: { line: number, column: number } }>>} */
    const scopeStack = [];

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
          ignoredPatterns.some((pattern) =>
            pattern.test(context.sourceCode.getText(a.node))
          )
        );

        if (shouldIgnore) continue;

        // Report the issue on the first await of the group
        // Note: Auto-fix is not provided as the transformation is complex
        // and requires understanding the full context. Manual refactoring
        // to Promise.all or fetchAllParallel is recommended.
        context.report({
          node: group[0].node,
          messageId: 'sequentialAwaits',
          data: {
            count: String(group.length),
          },
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
      AwaitExpression(node) {
        if (scopeStack.length === 0) return;

        const currentScope = scopeStack[scopeStack.length - 1];

        // Get the parent to check if it's a variable declaration
        const ancestors = context.sourceCode.getAncestors(node);
        const parent = ancestors[ancestors.length - 1];
        const _grandparent = ancestors[ancestors.length - 2];

        let variableName = null;

        // Check if await is in a variable declaration
        if (
          parent &&
          parent.type === 'VariableDeclarator' &&
          parent.id &&
          parent.id.type === 'Identifier'
        ) {
          variableName = parent.id.name;
        }

        // Get all identifiers used in the await expression's argument
        const usedIdentifiers = getUsedIdentifiers(node.argument);

        currentScope.push({
          node,
          variableName,
          usedIdentifiers,
          loc: node.loc?.start || { line: 0, column: 0 },
        });
      },
    };
  },
};

module.exports = rule;
module.exports.default = rule;
