const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite web support requires WASM files to be resolved as assets
config.resolver.assetExts.push('wasm');

// SharedArrayBuffer requires Cross-Origin Isolation headers for expo-sqlite web support
config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      middleware(req, res, next);
    };
  },
};

module.exports = config;
