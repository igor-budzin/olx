export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  collectCoverageFrom: ["src/**/*.{ts,js}", "!**/node_modules/**", "!**/dist/**"],
  extensionsToTreatAsEsm: [".ts"],
  coverageReporters: ["text", "lcov"],
  collectCoverage: true,
  transform: {

  },
};