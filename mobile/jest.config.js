module.exports = {
  preset: '@react-native/jest-preset',
  // Redux Toolkit and its dependencies ship ESM in node_modules; the RN
  // preset only transforms RN packages by default, so extend the pattern.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@reduxjs/toolkit|react-redux|immer|reselect|use-sync-external-store|react-native-webview)/)',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}'],
  coverageThreshold: {
    'src/domain/**': { statements: 90, branches: 90, functions: 90, lines: 90 },
    'src/application/**': { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};
