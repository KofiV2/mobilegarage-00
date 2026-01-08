module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**',
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  // Coverage thresholds - gradually increase as more tests are added
  // Current coverage is low due to many unused route files
  // Goal: Reach 70% coverage after integrating or removing unused routes
  coverageThreshold: {
    global: {
      branches: 2,
      functions: 3,
      lines: 3,
      statements: 3
    }
  },
  testTimeout: 10000,
  verbose: true
};
