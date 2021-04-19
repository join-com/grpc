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
      branches: 45,
      functions: 70,
      lines: 60,
      statements: 60,
    },
  },
};
