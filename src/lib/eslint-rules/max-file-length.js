/**
 * @nexvigilant/max-file-length
 *
 * Enforces maximum file length with per-pattern overrides.
 * Default: 500 lines. Actions: 600. Types: 800.
 *
 * @module lib/eslint-rules/max-file-length
 */

/**
 * Check if a file path matches a glob-like pattern (supports ** and *).
 */
function matchesPattern(filePath, pattern) {
  if (pattern.startsWith('**/')) {
    return filePath.includes(pattern.slice(3).replace(/\*/g, ''));
  }
  if (pattern.endsWith('*')) {
    return filePath.includes(pattern.slice(0, -1));
  }
  return filePath.includes(pattern);
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce maximum file length with per-pattern overrides',
      category: 'Best Practices',
    },
    schema: [
      {
        type: 'object',
        properties: {
          defaultMax: { type: 'number' },
          overrides: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                pattern: { type: 'string' },
                max: { type: 'number' },
              },
              required: ['pattern', 'max'],
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooLong: 'File has {{ actual }} lines (max {{ max }}). Split into smaller modules.',
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const defaultMax = options.defaultMax || 500;
    const overrides = options.overrides || [];

    return {
      'Program:exit'(node) {
        const filename = context.filename || context.getFilename();
        const lineCount = node.loc.end.line;

        let max = defaultMax;
        for (const override of overrides) {
          if (matchesPattern(filename, override.pattern)) {
            max = override.max;
            break;
          }
        }

        if (lineCount > max) {
          context.report({
            node,
            messageId: 'tooLong',
            data: { actual: lineCount, max },
            loc: { line: max, column: 0 },
          });
        }
      },
    };
  },
};
