/**
 * NexVigilant Custom ESLint Rules Plugin
 *
 * Custom ESLint rules for code quality and performance optimization.
 *
 * Usage in eslint.config.mjs:
 * ```javascript
 * import nexvigilantPlugin from './src/lib/eslint-rules/plugin.js';
 *
 * export default [
 *   {
 *     plugins: {
 *       '@nexvigilant': nexvigilantPlugin,
 *     },
 *     rules: {
 *       '@nexvigilant/no-sequential-awaits': 'warn',
 *     },
 *   },
 * ];
 * ```
 *
 * @module lib/eslint-rules/plugin
 */

const noSequentialAwaits = require('./no-sequential-awaits.js');
const noTimestampMethodMisuse = require('./no-timestamp-method-misuse.js');
const noClientSdkInServer = require('./no-client-sdk-in-server.js');
const maxFileLength = require('./max-file-length.js');

const plugin = {
  meta: {
    name: '@nexvigilant/eslint-plugin',
    version: '1.3.0',
  },
  rules: {
    'no-sequential-awaits': noSequentialAwaits,
    'no-timestamp-method-misuse': noTimestampMethodMisuse,
    'no-client-sdk-in-server': noClientSdkInServer,
    'max-file-length': maxFileLength,
  },
};

module.exports = plugin;
module.exports.default = plugin;
