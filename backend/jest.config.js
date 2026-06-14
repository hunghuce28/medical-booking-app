module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**',
  ],
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  testTimeout: 30000,
  verbose: true,
};
