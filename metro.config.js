const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Configure for Prisma compatibility
config.resolver.resolverMainFields.unshift('react-native');
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add node_modules resolution for Prisma
config.resolver.nodeModulesPaths = [
  './node_modules',
  ...(config.resolver.nodeModulesPaths || [])
];

// Ensure proper resolver for @prisma/client
config.resolver.alias = {
  ...config.resolver.alias,
  '@prisma/client': '@prisma/client/react-native'
};

module.exports = withNativeWind(config, { input: './global.css' });
