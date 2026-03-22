const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.sourceExts = ['ts', 'tsx', 'js', 'jsx', 'json', 'cjs', 'mjs'];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Resolve .js imports to .ts/.tsx files (for nodenext/node16 moduleResolution)
  if (moduleName.endsWith('.js')) {
    const tsName = moduleName.replace(/\.js$/, '.ts');
    try {
      return context.resolveRequest(context, tsName, platform);
    } catch {
      // fall through to default resolution
    }
    const tsxName = moduleName.replace(/\.js$/, '.tsx');
    try {
      return context.resolveRequest(context, tsxName, platform);
    } catch {
      // fall through to default resolution
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
