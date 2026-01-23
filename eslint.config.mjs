import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jestPlugin from 'eslint-plugin-jest';
import jestDomPlugin from 'eslint-plugin-jest-dom';
import jestFormattingPlugin from 'eslint-plugin-jest-formatting';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import globals from 'globals';

export default [
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      '**/dist/**',
      '**/out/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.d.ts',
      '**/generated/**',
    ],
  },
  // Base JS config
  js.configs.recommended,
  // Prettier config (turns off conflicting rules)
  prettierConfig,
  // JavaScript config files (CommonJS)
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
    rules: {
      'no-undef': 'off', // TypeScript handles this
    },
  },
  // TypeScript files
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
        project: ['./apps/storefront/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        // Node.js globals for config files
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // React globals
        JSX: 'readonly',
        React: 'readonly',
        // Custom global types (these are in global.d.ts)
        CustomFieldItems: 'readonly',
        CustomFieldStringItems: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      '@stylistic': stylistic,
      'import': importPlugin,
      'jsdoc': jsdocPlugin,
      'jsx-a11y': jsxA11yPlugin,
      'prettier': prettierPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'simple-import-sort': simpleImportSort,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./apps/storefront/tsconfig.json'],
        },
      },
    },
    rules: {
      // Prettier
      'prettier/prettier': 'warn',
      // Turn off rules that TypeScript handles better
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-redeclare': 'off', // TypeScript handles this
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_|error|e|err' }],
      '@typescript-eslint/no-explicit-any': 'off', // Too many pre-existing violations
      '@typescript-eslint/no-non-null-assertion': 'off', // Pre-existing code uses this pattern
      '@typescript-eslint/consistent-type-assertions': 'off',
      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/require-default-props': 'off',
      'react/jsx-no-useless-fragment': ['warn', { allowExpressions: true }],
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Import rules
      'import/prefer-default-export': 'off',
      'import/no-unresolved': 'off', // TypeScript handles this
      // Simple import sort
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^react', '^@?\\w'],
            ['^(@|components)(/.*|$)'],
            ['^\\u0000'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            ['^.+\\.?(css)$'],
          ],
        },
      ],
      // Restricted imports
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lodash',
              message: 'Import from lodash-es',
            },
          ],
          patterns: [
            {
              group: ['@mui/icons-material/*'],
              message: "Use `import { IconName } from '@mui/icons-material';`",
            },
          ],
        },
      ],
      'no-implicit-coercion': 'error',
    },
  },
  // Test files (vitest)
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/__mocks__/**/*.ts'],
    languageOptions: {
      globals: {
        // Vitest globals
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    plugins: {
      'jest': jestPlugin,
      'jest-dom': jestDomPlugin,
      'jest-formatting': jestFormattingPlugin,
      'testing-library': testingLibraryPlugin,
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      'testing-library/no-node-access': 'warn',
      'testing-library/no-container': 'warn',
      'testing-library/prefer-screen-queries': 'warn',
    },
  },
  // Pages and components
  {
    files: ['**/pages/**/*.ts', '**/pages/**/*.tsx', '**/components/**/*.ts', '**/components/**/*.tsx'],
    rules: {
      'no-param-reassign': 'off',
      'react/jsx-props-no-spreading': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
