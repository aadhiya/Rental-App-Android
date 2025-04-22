module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin', // Required for react-native-reanimated
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@/': './', // Matches the alias defined in tsconfig.json
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
    ],
  };
};
