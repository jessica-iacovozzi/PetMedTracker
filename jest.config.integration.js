const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Integration test specific config
const integrationJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.integration.js"],
  testEnvironment: "node", // Use node environment for API/database tests
  testMatch: ["<rootDir>/src/__tests__/integration/**/*.test.{js,jsx,ts,tsx}"],
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/e2e/",
    "<rootDir>/src/__tests__/components/",
    "<rootDir>/src/__tests__/lib/",
    "<rootDir>/src/__tests__/services/",
    "<rootDir>/src/__tests__/utils/",
  ],
  collectCoverageFrom: [
    "src/app/api/**/*.{js,jsx,ts,tsx}",
    "src/lib/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/components/(.*)$": "<rootDir>/src/components/$1",
    "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@/utils/(.*)$": "<rootDir>/src/utils/$1",
  },
  // Longer timeout for integration tests
  testTimeout: 30000,
};

module.exports = createJestConfig(integrationJestConfig);
