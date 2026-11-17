const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const EXCLUDE_REGEX = /node_modules/

module.exports = {
  entry: path.resolve(__dirname, 'src', 'index.js'),
  output: {
    path: path.resolve(__dirname, 'public', 'assets'),
    filename: 'bundle.js',
    chunkFilename: '[name].[contenthash:12].js',
    publicPath: process.env.PRODUCTION ? 'auto' : '/assets/',
    hashFunction: 'xxhash64'
  },
  mode: process.env.PRODUCTION ? "production" : "development",
  devServer: process.env.PRODUCTION ? undefined : {
    static: { directory: path.join(__dirname, "public") },
    port: 3000,
    proxy: [
      { context: ['/api'], target: 'http://localhost:5000' },
    ],
    hot: true,
    open: true,
    compress: true,
    devMiddleware: { writeToDisk: true },
  },
  watchOptions: {
    poll: 1000,
  },
  plugins: [
    new MiniCssExtractPlugin({ chunkFilename: '[name].[contenthash:12].css' }),
    {
      apply(compiler) {
        compiler.hooks.thisCompilation.tap('StartupAssets', compilation => {
          compilation.hooks.processAssets.tap({
            name: 'StartupAssets',
            stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
          }, () => {
            const images = Object.keys(compilation.assets).filter(name => name.startsWith('../images/'));
            compilation.emitAsset('app-assets.json', new compiler.webpack.sources.RawSource(JSON.stringify(images)));
          });
        });
      },
    },
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
        type: 'asset/resource',
        generator: {
          filename: '../images/[name].[contenthash:12][ext]'
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
