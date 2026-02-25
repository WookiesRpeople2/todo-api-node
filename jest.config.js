module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'app.js',
    'routes/**/*.js',
    'database/**/*.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 10000
};

