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
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30
    }
  },
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 10000
};
