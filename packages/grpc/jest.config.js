module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['jest-extended/all', '@join-com/jest-matchers'],
  testPathIgnorePatterns: ['/node_modules/', 'generated', 'support'],
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  resetMocks: true,
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  collectCoverageFrom: ['<rootDir>/src/**/*.{js,ts}', '!<rootDir>/src/__tests__/**/*.{js,ts}'],
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 70,
      lines: 60,
      statements: 60,
    },
  },
}
