module.exports = {
  overrides: [
    {
      exclude: /\/node_modules\//,
      presets: ['module:react-native-builder-bob/babel-preset'],
    },
    {
      include: /\/node_modules\//,
      // enableBabelRuntime pinned to the installed @babel/runtime so helpers
      // are imported once instead of inlined into every transformed file.
      presets: [
        [
          'module:@react-native/babel-preset',
          { enableBabelRuntime: '^7.25.0' },
        ],
      ],
    },
  ],
};
