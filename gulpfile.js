const gulp = require('gulp');
const NgBuild = require('ng-build');

const registry = new NgBuild(this, {
    chunks: true,
    unitTestFramework: 'jest',
    jest: {
        transform: {
            lodash: '<transformerDir>/window-script-transformer',
        },
        transformIgnorePatterns: ['node_modules/(?!(lodash)/)'],
        testPathIgnorePatterns: ['/node_modules/'],
        moduleNameMapper: {
            '^src(.*)$': '<rootDir>/src$1',
            '^tests(.*)$': '<rootDir>/tests$1',
        },
    },
});

gulp.registry(registry);
