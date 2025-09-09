module.exports = {
  root: true,
  ignorePatterns: ['dist/', 'out/', 'build/', 'coverage/'],
  env: {
    browser: true,
    es2021: true,
  },
  reportUnusedDisableDirectives: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: true,
    tsconfigRootDir: process.cwd(),
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  plugins: ['react', '@typescript-eslint', 'testing-library', 'simple-import-sort'],
  extends: [
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'airbnb',
    'airbnb/hooks',
    'airbnb-typescript',
    'plugin:@bigcommerce/recommended',
    'plugin:prettier/recommended',
    'plugin:testing-library/react',
  ],
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
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '**/tests/**/*.ts',
          '**/tests/**/*.tsx',
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/__mocks__/**',
          'vite.config.ts',
          './generate-translations-csv.ts',
        ],
      },
    ],
    'react/jsx-no-useless-fragment': ['warn', { allowExpressions: true }],
    'import/prefer-default-export': 'off',
    'no-implicit-coercion': 'error',
    'react/prop-types': 'off',
    '@typescript-eslint/no-useless-template-literals': 'error',
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // Packages `react` related packages come first.
          ['^react', '^@?\\w'],
          // Internal packages.
          ['^(@|components)(/.*|$)'],
          // Side effect imports.
          ['^\\u0000'],
          // Parent imports. Put `..` last.
          ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
          // Other relative imports. Put same-folder imports and `.` last.
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
          // Style imports.
          ['^.+\\.?(css)$'],
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            name: 'msw',
            message: 'Import from tests/test-utils',
          },
        ],
      },
    },
    {
      files: ['src/pages/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
      rules: {
        'no-param-reassign': 0,
      },
    },
    {
      files: ['src/components/**/*.{ts,tsx}', 'src/pages/**/*.{ts,tsx}'],
      rules: {
        'react/jsx-props-no-spreading': 0,
      },
    },
    {
      files: [
        'src/*.{ts,tsx}',
        'src/components/**/*.{ts,tsx}',
        'src/pages/**/*.{ts,tsx}',
        'src/hooks/**/*.ts',
        'src/hooks/*.ts',
        'src/utils/**/*.ts',
        'src/utils/*.ts',
        '**.**.ts',
      ],
      rules: {
        '@typescript-eslint/no-shadow': 0,
      },
    },
    {
      files: [
        'src/pages/AccountSetting/index.tsx',
        'src/pages/AccountSetting/utils.ts',
        'src/pages/AddressList/components/AddressForm.tsx',
        'src/pages/Invoice/InvoiceItemCard.tsx',
        'src/pages/OrderDetail/components/OrderDialog.tsx',
        'src/pages/PDP/index.tsx',
        'src/pages/QuickOrder/components/QuickOrderCard.tsx',
        'src/pages/QuickOrder/components/QuickOrderPad.tsx',
        'src/pages/QuickOrder/components/QuickOrderB2BTable.tsx',
        'src/pages/Registered/RegisterComplete.tsx',
        'src/pages/Registered/RegisteredAccount.tsx',
        'src/pages/Registered/config.ts',
        'src/pages/Registered/types.ts',
        'src/pages/RegisteredBCToB2B/index.tsx',
        'src/pages/ShoppingListDetails/components/AddToShoppingList.tsx',
        'src/pages/ShoppingListDetails/components/ChooseOptionsDialog.tsx',
        'src/pages/ShoppingListDetails/components/ReAddToCart.tsx',
        'src/pages/ShoppingListDetails/components/ShoppingDetailCard.tsx',
        'src/pages/ShoppingListDetails/components/ShoppingDetailFooter.tsx',
        'src/pages/ShoppingListDetails/components/ShoppingDetailHeader.tsx',
        'src/pages/ShoppingListDetails/components/ShoppingDetailTable.tsx',
        'src/pages/ShoppingListDetails/index.tsx',
        'src/pages/ShoppingLists/index.tsx',
        'src/pages/UserManagement/config.ts',
        'src/pages/UserManagement/getUserExtraFields.ts',
        'src/pages/order/Order.tsx',
        'src/pages/order/config.ts',
        'src/pages/QuoteDetail/index.tsx',
        'src/pages/QuoteDraft/index.tsx',
        'src/pages/QuotesList/index.tsx',
        'src/pages/quote/components/ContactInfo.tsx',
        'src/pages/quote/components/QuoteAddress.tsx',
        'src/pages/quote/components/QuoteDetailTable.tsx',
        'src/pages/quote/components/QuoteDetailTableCard.tsx',
        'src/pages/QuotesList/QuoteItemCard.tsx',
        'src/pages/quote/components/QuoteTable.tsx',
        'src/pages/quote/components/QuoteTableCard.tsx',
        'src/components/B3CustomForm.tsx',
        'src/components/B3ProductList.tsx',
        'src/components/button/CustomButton.tsx',
        'src/components/filter/B3Filter.tsx',
        'src/components/filter/B3FilterMore.tsx',
        'src/components/form/*.{ts,tsx}',
        'src/components/ui/B3Select.tsx',
        'src/components/upload/B3Upload.tsx',
        'src/components/upload/BulkUploadTable.tsx',
        'src/hooks/**/*.ts',
        'src/shared/service/**/graphql/*.ts',
        'src/shared/service/request/*.ts',
        'src/types/*.ts',
        'src/utils/b3Product/shared/*.ts',
        'src/utils/b3AddToShoppingList.ts',
        'src/utils/b3Product/*.ts',
        'src/utils/*.ts',
        'src/**.d.ts',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 0,
      },
    },
    {
      files: [
        'src/components/form/*.ts',
        'src/pages/ShoppingListDetails/components/ShoppingDetailTable.tsx',
        'src/pages/QuotesList/QuoteItemCard.tsx',
        'src/pages/QuotesList/index.tsx',
        'src/utils/*.ts',
        'tests/components/captcha/*.*.tsx',
      ],
      rules: {
        '@typescript-eslint/ban-types': 0,
      },
    },
    {
      files: ['src/components/upload/*.tsx'],
      rules: { 'react/destructuring-assignment': 0 },
    },
    {
      files: ['src/pages/**/*.{ts,tsx}'],
      rules: { '@typescript-eslint/no-non-null-assertion': 0 },
    },
    {
      files: ['src/components/**/*.tsx', 'src/pages/**/*.{ts,tsx}'],
      rules: { '@bigcommerce/jsx-short-circuit-conditionals': 0 },
    },
    {
      files: ['src/store/slices/*.ts'],
      rules: { 'no-param-reassign': ['error', { props: false }] },
    },
  ],
};
