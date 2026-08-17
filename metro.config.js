const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// kaori-core is a `file:` dependency, so node_modules/kaori-core is a symlink pointing
// outside this project. Metro only watches its own root by default, so without this it
// resolves the package but never sees edits to it — and can't read its files at all on a
// cold start. `nodeModulesPaths` lets the resolver follow the link; `watchFolders` makes
// changes to core reload the app.
const CORE = path.resolve(__dirname, '../kaori-core');
config.watchFolders = [...(config.watchFolders ?? []), CORE];

// SVG transformer support
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};
config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
  nodeModulesPaths: [
    ...(config.resolver.nodeModulesPaths ?? []),
    path.resolve(__dirname, 'node_modules'),
    path.resolve(CORE, 'node_modules'),
  ],
};

module.exports = withNativeWind(config, { input: './global.css' });
