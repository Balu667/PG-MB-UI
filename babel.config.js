// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // keep other plugins (if any) here...
      "react-native-reanimated/plugin", // MUST be last
    ],
  };
};
