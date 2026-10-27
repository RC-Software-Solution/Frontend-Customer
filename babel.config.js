module.exports = function (api) {
  // Metro passes isDev; anything else (Jest) counts as dev so tests keep their console spies.
  const isDev = api.caller((caller) => caller?.isDev !== false);
  return {
    presets: ["babel-preset-expo"],
    plugins: isDev ? [] : [["transform-remove-console", { exclude: ["error", "warn"] }]],
  };
};
