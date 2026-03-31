import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import { createRequire } from 'module';

// Import custom NexVigilant ESLint rules
const require = createRequire(import.meta.url);
const nexvigilantPlugin = require('./src/lib/eslint-rules/plugin.js');

export default [
  // Base JS recommended rules
  js.configs.recommended,

  // Global ignores
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'public/**',
      'scripts/**',
      'infrastructure/**',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      'tools/**',
      // Unused starter templates (not imported anywhere in app)
      'src/components/compositions/**',
      // Advanced hooks (experimental, not in production use)
      'src/hooks/advanced/**',
      // Test utilities (lower priority for strict typing)
      'src/__tests__/utils/**',
      'src/__tests__/fixtures/**',
      // Dev-only tools
      'src/app/admin/seed/**',
      // Forge-generated public vigilance scaffolds are intentionally incomplete
      // until promoted into the curated navigation and polished for production.
      'src/app/vigilance/**',
    ],
  },

  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Headers: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        ReadableStream: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        crypto: 'readonly',
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLDivElement: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        CustomEvent: 'readonly',
        NodeJS: 'readonly',
        RequestInit: 'readonly',
        BodyInit: 'readonly',
        HeadersInit: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@next/next': nextPlugin,
      '@nexvigilant': nexvigilantPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // TypeScript rules
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_|^error$|^err$|^e$',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': true,
        'ts-nocheck': true,
        'ts-check': false,
        minimumDescriptionLength: 10,
      }],
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
        disallowTypeAnnotations: false,
      }],
      'no-restricted-syntax': ['error',
        {
          selector: 'TSAsExpression[typeAnnotation.typeName.name="any"]',
          message: 'Do not use `as any`. Use a proper type or `unknown`.',
        },
        {
          selector: 'TSTypeAssertion',
          message: 'Use `as` syntax instead of angle-bracket type assertions.',
        },
      ],

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // NexVigilant custom rules
      '@nexvigilant/no-sequential-awaits': ['error', {
        minSequential: 2,
        ignoredPatterns: [
          'transaction',            // Database transactions must be sequential
          'mutex',                  // Mutex operations must be sequential
          'requireAdmin',           // Auth guard must complete before data access
          'requireModerator',       // Auth guard must complete before data access
          'requireAuth',            // Auth guard must complete before data access
          'revalidatePath',         // Cache invalidation after mutation
          'revalidateTag',          // Cache invalidation after mutation
          'verifySessionCookie',    // Session auth must complete first
          'verifyIdToken',          // Token auth must complete first
          'cookies\\(',             // Next.js cookies() is auth prerequisite
          'checkAdmin',             // Local auth guard pattern
          'checkAuth',              // Local auth guard pattern
          'getCurrentUser',         // Must resolve user before data access
        ],
      }],
      '@nexvigilant/no-timestamp-method-misuse': ['error', {
        ignoredVariables: [],
        strictMode: false,
      }],
      '@nexvigilant/no-client-sdk-in-server': ['error', {
        allowedFiles: [],
      }],
      '@nexvigilant/max-file-length': ['error', {
        defaultMax: 500,
        overrides: [
          { pattern: '**/actions/**', max: 600 },
          { pattern: '**/actions.ts', max: 600 },
          { pattern: '**/types/**', max: 800 },
          { pattern: '**/types.ts', max: 800 },
        ],
      }],

      // Next.js rules
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'off',
      '@next/next/no-sync-scripts': 'error',

      // General rules
      'no-console': 'off',
      'no-unused-vars': 'off', // Use TypeScript version
      'no-undef': 'off', // TypeScript handles this
    },
  },

  // Disable sequential-awaits rule for test files (tests often need sequential execution)
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**/*.ts', '**/__tests__/**/*.tsx'],
    rules: {
      '@nexvigilant/no-sequential-awaits': 'off',
    },
  },

  // JavaScript files (if any)
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
];
