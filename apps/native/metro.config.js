// Learn more https://docs.expo.io/guides/customizing-metro
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const nativewindPackageDir = path.dirname(require.resolve("nativewind/package.json"));
const cssInteropPackageDir = path.dirname(
  require.resolve("react-native-css-interop/package.json", {
    paths: [nativewindPackageDir],
  }),
);

config.resolver.unstable_enablePackageExports = true;
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  "react-native-css-interop": cssInteropPackageDir,
};

module.exports = withNativeWind(config, {
  input: "./global.css",
});
