const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure Metro can handle all file types properly
config.resolver.assetExts.push(
    // Add any additional asset extensions your app uses
    'db',
    'mp3',
    'ttf',
    'obj',
    'png',
    'jpg',
    'jpeg',
    'gif',
    'webp',
    'svg'
);

// Configure transformer to handle all file types
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

module.exports = config;
