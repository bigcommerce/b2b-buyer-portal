require('@bigcommerce/eslint-config/patch');

module.exports = {
  extends: ['@bigcommerce/eslint-config'],
  ignorePatterns: ['dist/', 'out/', 'build/'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'no-implicit-coercion': 'error',
  },
};
