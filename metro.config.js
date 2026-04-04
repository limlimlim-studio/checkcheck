const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite web support requires WASM files to be resolved as assets
config.resolver.assetExts.push('wasm');

module.exports = config;
