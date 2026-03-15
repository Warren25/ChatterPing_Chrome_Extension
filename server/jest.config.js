module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/server/*.test.js', '<rootDir>/tests/server/**/*.test.js'],
  moduleDirectories: ['node_modules', '<rootDir>/server/node_modules'],
  clearMocks: true,
  resetMocks: true,
};
