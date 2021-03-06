const path = require('path');

module.exports = {
  entry: './src/index.js',
  devtool:'eval-source-map',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        include: [path.join(__dirname, "./src")]
      },
    ]
  }
};