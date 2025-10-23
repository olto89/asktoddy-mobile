// ESLint 9+ Flat Config for React Native/Expo
export default [
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Relaxed rules for React Native development
      'no-console': 'off',
      'no-unused-vars': 'warn',
      'no-undef': 'off', // React Native globals are handled by Metro
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off', // Not needed in React Native
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'ios/**',
      'android/**',
      '.expo/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.config.js',
      'metro.config.js',
      'babel.config.js',
      'Payload/**',
      'Symbols/**',
      'test-*.js',
    ],
  },
];
