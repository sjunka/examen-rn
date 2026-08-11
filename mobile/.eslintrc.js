module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // The domain layer is pure business logic: it must stay importable
      // outside React Native (unit-testable in plain Node) and ignorant of
      // any specific infrastructure (network, storage, native modules).
      files: ['src/domain/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  'react',
                  'react-native',
                  'react-native/*',
                  'react-redux',
                  '@reduxjs/toolkit',
                  '**/infrastructure/**',
                ],
                message:
                  'Domain layer must not depend on React, React Native, Redux, or infrastructure.',
              },
            ],
          },
        ],
      },
    },
  ],
};
