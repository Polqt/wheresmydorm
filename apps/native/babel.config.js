module.exports = (api) => {
  api.cache(true);
  const nativeWind = require("nativewind/babel")();

  return {
    presets: ["babel-preset-expo"],
    plugins: nativeWind.plugins,
  };
};
