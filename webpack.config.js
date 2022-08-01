const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const EXCLUDE_REGEX = /node_modules/

module.exports = {
  entry: path.resolve(__dirname, 'src', 'index.js'),
  output: {
    path: path.resolve(__dirname, 'public', 'assets'),
    filename: 'bundle.js'
  },
  mode: process.env.production ? "production" : "development",
  devServer: process.env.production ? undefined : {
    contentBase: path.join(__dirname, "public"),
    port: 3000,
    hot: true,
    open: true,
    progress: true,
    compress: true,
    writeToDisk: true,
  },
  plugins: [
    new MiniCssExtractPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        exclude: EXCLUDE_REGEX,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.scss$/,
        exclude: EXCLUDE_REGEX,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          "sass-loader",
        ],
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        exclude: EXCLUDE_REGEX,
        loader: 'file-loader',
        options: {
          name: '../images/[name].[ext]'
        }
      },
      {
        test: /\.(jsx|js)$/,
        include: path.resolve(__dirname, 'src'),
        exclude: EXCLUDE_REGEX,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  "targets": "defaults" 
                }],
                '@babel/preset-react'
              ]
            }
          }
        ]
      },
    ]
  }
}