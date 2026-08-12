const path = require('path');
const { getConfig } = require('react-native-builder-bob/babel-config');
const pkg = require('../package.json');

const root = path.resolve(__dirname, '..');

module.exports = getConfig(
  {
    // enableBabelRuntime pinned to the @babel/runtime in package.json so
    // helpers are imported once instead of inlined into every bundled file.
    presets: [
      ['module:@react-native/babel-preset', { enableBabelRuntime: '^7.25.0' }],
    ],
  },
  { root, pkg }
);
