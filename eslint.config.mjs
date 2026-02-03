import configPromise from '@bigcommerce/eslint-config';
import globals from 'globals';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const baseConfig = await configPromise;

export default [
  ...(Array.isArray(baseConfig) ? baseConfig : []),
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        project: ['./apps/storefront/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./apps/storefront/tsconfig.json'],
        },
      },
    },
    rules: {
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
      'prettier/prettier': ['warn'],
      'react/react-in-jsx-scope': 0,
      'react/require-default-props': 0,
      'react/jsx-no-useless-fragment': ['warn', { allowExpressions: true }],
      'import/prefer-default-export': 'off',
      'no-implicit-coercion': 'error',
      'react/prop-types': 'off',
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
    },
  },
  // Test files
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
    },
  },
  // Pages and components
  {
    files: ['**/pages/**/*.{ts,tsx}', '**/components/**/*.{ts,tsx}'],
    rules: {
      'no-param-reassign': 0,
      'react/jsx-props-no-spreading': 0,
      '@bigcommerce/jsx-short-circuit-conditionals': 0,
      '@typescript-eslint/no-non-null-assertion': 0,
    },
  },
  {
    ignores: [
      'node_modules/**',
      '**/dist/**',
      '**/out/**',
      '**/build/**',
      '**/coverage/**',
    ],
  },
];
