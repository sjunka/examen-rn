const path = require('path');
const exclusionList = require('metro-config/private/defaults/exclusionList').default;
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// rn-savings-notifier is a `file:` dependency living outside this project
// root (../libreria), linked into node_modules as a symlink. Metro only
// watches projectRoot by default, so without watchFolders it can resolve
// the require() but never see the real source files behind the symlink to
// actually bundle them.
const libraryRoot = path.resolve(__dirname, '../libreria/rn-savings-notifier');

// The library ships its own node_modules with its own react/react-native
// (peer deps, pinned to a different RN version for its standalone repo).
// Left alone, Metro would resolve two copies of these singletons — a
// second React instance, and a react-native whose bundled asset registry
// doesn't line up with this app's version. blockList excludes the
// library's copies; extraNodeModules redirects any require for them
// (from code Metro resolves under watchFolders) to this app's copies.
const singletons = ['react', 'react-native'];

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  watchFolders: [libraryRoot],
  resolver: {
    blockList: exclusionList(
      singletons.map(
        name =>
          new RegExp(`^${path.join(libraryRoot, 'node_modules', name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/.*$`),
      ),
    ),
    extraNodeModules: Object.fromEntries(
      singletons.map(name => [name, path.resolve(__dirname, 'node_modules', name)]),
    ),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
