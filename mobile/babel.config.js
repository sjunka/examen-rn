module.exports = {
  presets: [
    [
      'module:@react-native/babel-preset',
      {
        runtime: 'automatic',
      },
    ],
  ],
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        version: '7.29.7',
      },
    ],
  ],
};
