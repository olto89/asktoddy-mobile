/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      'jest-)?react-native' +
      '|@react-native(-community)?' +
      '|expo(nent)?' +
      '|@expo(nent)?/.*' +
      '|@expo-google-fonts/.*' +
      '|react-navigation' +
      '|@react-navigation/.*' +
      '|@supabase/.*' +
      '|react-native-purchases' +
      '|react-native-gesture-handler' +
      '|react-native-keyboard-aware-scroll-view' +
      '|react-native-screens' +
      '|react-native-safe-area-context' +
      ')',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/index.ts'],
  coverageReporters: ['text', 'text-summary', 'lcov'],
  testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}'],
};
