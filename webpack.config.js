//@ts-check

'use strict';

const path = require('path');

/**@type {import('webpack').Configuration}*/

const config = {
  target: 'node',
  entry: {
    'extension': './src/extension.ts',
    'webview': './src/webview/main.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode',
    ssh2: 'commonjs ssh2',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [{
      test: /\.ts$/,
      exclude: /node_modules/,
      use: [{
        loader: 'ts-loader',
      }, ],
    }, ],
  },
};

module.exports = config;