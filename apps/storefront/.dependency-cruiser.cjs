const testFilesRegex = '(/|\\.)(spec|test)\\.(js|ts|tsx|jsx)$';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-orphans',
      comment: 'This file is unused, consider removing it',
      severity: 'error',
      from: {
        path: '^src/',
        pathNot: [testFilesRegex],
      },
      module: {
        path: '^src/',
        pathNot: [
          testFilesRegex,
          '\\.d\\.ts$',
          '__mocks__',
          '.eslintrc.json',
          // Entry points
          '^src/main.ts',
          '^src/headless.ts',
          '^src/asset-loader.ts',
          // This should be removed once we get proper gql types
          'src/types/gql/index.ts',
        ],
        numberOfDependentsLessThan: 1,
      },
    },
    {
      name: 'no-test-orphans',
      comment: 'This file is unused, consider removing it',
      severity: 'error',
      from: {
        path: ['^tests/'],
      },
      module: {
        path: ['^tests/'],
        pathNot: [testFilesRegex, '\\.d\\.ts$', '^tests/setup-test-environment.ts'],
        numberOfDependentsLessThan: 1,
      },
    },
    {
      name: 'no-non-package-json',
      comment: 'This file depends on a module that is not listed in package.json',
      severity: 'error',
      from: {},
      to: {
        dependencyTypes: ['npm-no-pkg', 'npm-unknown'],
      },
    },
    {
      name: 'not-to-test',
      comment: 'Do not import anything from the test folder from production files',
      severity: 'error',
      from: {
        path: '^src/',
        pathNot: testFilesRegex,
      },
      to: {
        path: '^(tests)',
      },
    },
    {
      name: 'not-to-spec',
      comment: 'Do not import spec files',
      severity: 'error',
      from: {},
      to: {
        path: testFilesRegex,
      },
    },
    {
      name: 'not-to-dev-dep',
      severity: 'error',
      comment: ' Do no import dev dependencies from production files',
      from: {
        path: '^src',
        pathNot: testFilesRegex,
      },
      to: {
        dependencyTypes: ['npm-dev'],
      },
    },
  ],
  options: {
    extraExtensionsToScan: ['.svg', '.jpg', '.png', '.json'],
    doNotFollow: {
      path: ['node_modules', 'dist'],
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
