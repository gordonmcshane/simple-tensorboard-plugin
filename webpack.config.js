const path = require('path');

module.exports = {
  entry: './tensorboard_plugin_service_status/static/index.tsx',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'tensorboard_plugin_service_status/static'),
    library: {
        type: 'module'
    }
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      }
    ],
  },
  mode: 'production',
  experiments: {
    outputModule: true,
  },
};