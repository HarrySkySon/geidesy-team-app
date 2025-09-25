const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for custom file extensions if needed
config.resolver.sourceExts.push('sql');

module.exports = config;