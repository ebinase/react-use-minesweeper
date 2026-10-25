/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: { module: 'commonjs', moduleResolution: 'node', types: ['jest'] } },
    ],
  },
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/types.ts', '!src/types/**/*'],
};
