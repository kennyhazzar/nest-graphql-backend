/* eslint-disable */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

const localPathMapper = {
  ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  '^@/unit/(.*)$': '<rootDir>/test/unit/$1',
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
      {},
    ],
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: [
    '<rootDir>/.git/',
    '<rootDir>/coverage',
    '<rootDir>/dist/',
    '<rootDir>/node_modules/',
    '<rootDir>/static/',
    '<rootDir>/templates/',
    '<rootDir>/test/',
    '<rootDir>/upload/',
  ],
};
