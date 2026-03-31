/**
 * AlgoVigilance Custom ESLint Rules Plugin
 *
 * Custom ESLint rules for code quality and performance optimization.
 *
 * @module lib/eslint-rules
 */

import noSequentialAwaits from './no-sequential-awaits';

/**
 * Plugin configuration for ESLint flat config
 */
const plugin = {
  meta: {
    name: '@nexvigilant/eslint-plugin',
    version: '1.0.0',
  },
  rules: {
    'no-sequential-awaits': noSequentialAwaits,
  },
  configs: {
    recommended: {
      rules: {
        '@nexvigilant/no-sequential-awaits': 'warn',
      },
    },
    strict: {
      rules: {
        '@nexvigilant/no-sequential-awaits': 'error',
      },
    },
  },
};

export default plugin;
export { noSequentialAwaits };
