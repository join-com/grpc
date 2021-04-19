module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["generated"],

  testMatch: ['**/__tests__/**/*.test.ts'],

  collectCoverageFrom: [
    '<rootDir>/src/**/*.{js,ts}',
    '!<rootDir>/src/__tests__/**/*.{js,ts}'
  ],

  coverageThreshold: {
    global: {
      branches: 40,
      functions: 60,
      lines: 50,
      statements: 50,
    },
  },
};
