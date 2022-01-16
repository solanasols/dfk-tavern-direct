const path = require('path');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'var',
    library: 'EntryPoint'
  },
  plugins: [
    new NodePolyfillPlugin({
      excludeAliases: ["console"]
    }),
  ]
};