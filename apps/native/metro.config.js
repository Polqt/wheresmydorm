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

// SVG transformer
const { transformer, resolver } = config;
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};
config.resolver = {
  ...config.resolver,
  assetExts: (resolver.assetExts ?? []).filter((ext) => ext !== "svg"),
  sourceExts: [...(resolver.sourceExts ?? []), "svg"],
};

module.exports = withNativeWind(config, {
  input: "./global.css",
});
