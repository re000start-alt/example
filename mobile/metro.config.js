const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, {
  transformer: {
    babelTransformerPath: require.resolve("metro-react-native-babel-preset"),
  },
});
