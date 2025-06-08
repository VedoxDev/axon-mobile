const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for LiveKit React Native WebRTC
config.resolver.assetExts.push('bin');

module.exports = config;
