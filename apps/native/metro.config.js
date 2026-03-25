// Learn more https://docs.expo.io/guides/customizing-metro
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);
const nativewindPackageDir = path.dirname(require.resolve("nativewind/package.json"));
const cssInteropPackageDir = path.dirname(
  require.resolve("react-native-css-interop/package.json", {
    paths: [nativewindPackageDir],
  }),
);

// Include the monorepo root so Metro can resolve packages hoisted there by pnpm
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

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
