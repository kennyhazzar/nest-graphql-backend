/* eslint-disable */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../../../tsconfig.json');

const localPathMapper = {
  ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/../../../' }),
  '^@/unit/(.*)$': '<rootDir>/../unit/$1',
};

module.exports = {
  testTimeout: 180000,
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: localPathMapper,
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        // Disable type-checking for faster tests
        // isolatedModules: true,
      },
    ],
  },
  testMatch: ['**/*.e2e-spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/../../../.git/',
    '<rootDir>/../../../coverage',
    '<rootDir>/../../../dist/',
    '<rootDir>/../../../node_modules/',
  ],
};
