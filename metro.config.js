const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Configure for web and native compatibility
config.resolver.resolverMainFields.unshift('react-native');
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add node_modules resolution for better package resolution
config.resolver.nodeModulesPaths = [
  './node_modules',
  ...(config.resolver.nodeModulesPaths || [])
];

// Web-specific optimizations
if (config.resolver.alias) {
  config.resolver.alias = {
    ...config.resolver.alias,
    // Ensure proper web compatibility for crypto
    'crypto': require.resolve('react-native-get-random-values'),
    // Remove Prisma alias as we're using Turso
  };
} else {
  config.resolver.alias = {
    'crypto': require.resolve('react-native-get-random-values'),
  };
}

// Ensure proper file extensions are resolved
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Web bundling optimizations
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer?.minifierConfig,
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
