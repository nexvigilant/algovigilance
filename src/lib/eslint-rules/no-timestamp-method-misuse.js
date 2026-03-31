/**
 * ESLint Rule: no-timestamp-method-misuse
 *
 * Detects direct usage of .toMillis() and .toDate() on potentially serialized timestamps.
 * Server actions return SerializedTimestamp objects, not Firestore Timestamps.
 * Calling .toMillis() or .toDate() on SerializedTimestamp will throw at runtime.
 *
 * Suggests using the safe utilities from @/types/academy:
 * - toMillisFromSerialized() instead of .toMillis()
 * - toDateFromSerialized() instead of .toDate()
 * - formatTimestamp() for date string formatting
 *
 * @module lib/eslint-rules/no-timestamp-method-misuse
 */

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Detect potentially unsafe .toMillis() and .toDate() calls on serialized timestamps',
      category: 'Possible Errors',
      recommended: true,
      url: 'https://github.com/nexvigilant/studio/blob/main/docs/rules/no-timestamp-method-misuse.md',
    },
    fixable: 'code',
    hasSuggestions: true,
    messages: {
      unsafeToMillis:
        'Calling .toMillis() may fail on serialized timestamps. Use toMillisFromSerialized() from @/types/academy instead.',
      unsafeToDate:
        'Calling .toDate() may fail on serialized timestamps. Use toDateFromSerialized() or formatTimestamp() from @/types/academy instead.',
      suggestToMillis:
        'Replace with toMillisFromSerialized({{property}})',
      suggestToDate:
        'Replace with toDateFromSerialized({{property}}) or formatTimestamp({{property}})',
    },
    schema: [
      {
        type: 'object',
        properties: {
          ignoredVariables: {
            type: 'array',
            items: { type: 'string' },
            default: [],
            description: 'Variable names to ignore (e.g., known Firestore Timestamps)',
          },
          strictMode: {
            type: 'boolean',
            default: false,
            description: 'If true, warns on all .toMillis()/.toDate() calls, not just timestamp-like patterns',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const ignoredVariables = new Set(options.ignoredVariables || []);
    const strictMode = options.strictMode || false;

    /**
     * Check if a property name looks like a timestamp field
     * @param {string} name
     * @returns {boolean}
     */
    function looksLikeTimestamp(name) {
      if (!name) return false;
      const timestampPatterns = [
        /At$/,           // createdAt, updatedAt, publishedAt, enrolledAt, lastAccessedAt
        /Date$/,         // startDate, endDate
        /Time$/,         // startTime, endTime
        /^timestamp$/i,  // timestamp
        /^ts$/i,         // ts
      ];
      return timestampPatterns.some(pattern => pattern.test(name));
    }

    /**
     * Get the property access chain as a string
     * @param {import('estree').MemberExpression} node
     * @returns {string}
     */
    function getPropertyChain(node) {
      const parts = [];
      let current = node;

      while (current && current.type === 'MemberExpression') {
        if (current.property.type === 'Identifier') {
          parts.unshift(current.property.name);
        }
        current = current.object;
      }

      if (current && current.type === 'Identifier') {
        parts.unshift(current.name);
      }

      return parts.join('.');
    }

    /**
     * Get the object being accessed (for suggestion)
     * @param {import('estree').MemberExpression} node
     * @returns {string}
     */
    function getObjectText(node) {
      const sourceCode = context.sourceCode || context.getSourceCode();
      return sourceCode.getText(node.object);
    }

    return {
      CallExpression(node) {
        // Check if it's a member function call
        if (node.callee.type !== 'MemberExpression') return;

        const methodName = node.callee.property.type === 'Identifier'
          ? node.callee.property.name
          : null;

        if (!methodName) return;

        // Check for .toMillis() or .toDate() calls
        const isToMillis = methodName === 'toMillis';
        const isToDate = methodName === 'toDate';

        if (!isToMillis && !isToDate) return;

        // Get the object being called on
        const objectText = getObjectText(node.callee);
        const propertyChain = getPropertyChain(node.callee);

        // Check if the variable is in the ignore list
        const rootIdentifier = propertyChain.split('.')[0];
        if (ignoredVariables.has(rootIdentifier)) return;

        // In strict mode, warn on all calls
        // Otherwise, only warn if it looks like a timestamp field
        const shouldWarn = strictMode ||
          looksLikeTimestamp(propertyChain.split('.').pop()) ||
          // Also check for common timestamp patterns in the chain
          /\.(createdAt|updatedAt|publishedAt|enrolledAt|lastAccessedAt|issuedAt|completedAt|startedAt)\./.test(propertyChain + '.');

        if (!shouldWarn) return;

        if (isToMillis) {
          context.report({
            node,
            messageId: 'unsafeToMillis',
            fix(fixer) {
              return fixer.replaceText(node, `toMillisFromSerialized(${objectText})`);
            },
          });
        } else if (isToDate) {
          context.report({
            node,
            messageId: 'unsafeToDate',
            fix(fixer) {
              return fixer.replaceText(node, `toDateFromSerialized(${objectText})`);
            },
          });
        }
      },
    };
  },
};

module.exports = rule;
module.exports.default = rule;
