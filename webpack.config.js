const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const Dotenv = require('dotenv-webpack')

const isDevelopment = process.env.NODE_ENV !== 'production'

// Path aliases from jsconfig.json
const aliases = {
  '@BasicComponents': path.resolve(__dirname, 'src/components/basic/index.js'),
  '@ComposedComponents': path.resolve(
    __dirname,
    'src/components/composed/index.js',
  ),
  '@LayoutComponents': path.resolve(
    __dirname,
    'src/components/layouts/index.js',
  ),
  '@ContainerComponents': path.resolve(
    __dirname,
    'src/components/containers/index.js',
  ),
  '@Assets': path.resolve(__dirname, 'src/assets'),
  '@Contexts': path.resolve(__dirname, 'src/contexts/index.js'),
  '@Hooks': path.resolve(__dirname, 'src/hooks/index.js'),
  '@Pages': path.resolve(__dirname, 'src/pages/index.js'),
  '@APIs': path.resolve(__dirname, 'src/services/API/index.js'),
  '@Cryptos': path.resolve(__dirname, 'src/services/Crypto/index.js'),
  '@Databases': path.resolve(__dirname, 'src/services/Database/index.js'),
  '@Entities': path.resolve(__dirname, 'src/services/Entity/index.js'),
  '@Helpers': path.resolve(__dirname, 'src/utils/Helpers/index.js'),
  '@Constants': path.resolve(__dirname, 'src/utils/Constants/index.js'),
  '@TestData': path.resolve(__dirname, 'src/utils/TestData/index.js'),
  '@Storage': path.resolve(__dirname, 'src/services/Storage/index.js'),
  '@Version': path.resolve(__dirname, 'src/version/version.js'),
  src: path.resolve(__dirname, 'src'),
}

module.exports = {
  mode: isDevelopment ? 'development' : 'production',

  entry: {
    main: './src/index.js',
  },

  output: {
    path: path.resolve(__dirname, 'build'),
    filename: isDevelopment
      ? 'static/js/[name].js'
      : 'static/js/[name].[contenthash:8].js',
    chunkFilename: isDevelopment
      ? 'static/js/[name].chunk.js'
      : 'static/js/[name].[contenthash:8].chunk.js',
    assetModuleFilename: 'static/media/[name].[hash:8][ext]',
    publicPath: isDevelopment ? '/' : '',
    clean: true,
  },

  devtool: isDevelopment ? 'cheap-module-source-map' : 'source-map',

  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    hot: true,
    port: process.env.PORT || 3000,
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
    },
    open: true,
    historyApiFallback: {
      disableDotRule: true,
      rewrites: [
        {
          from: /\.wasm$/,
          to: (context) => context.parsedUrl.pathname,
        },
      ],
    },
    setupMiddlewares: (middlewares, devServer) => {
      if (devServer && devServer.app) {
        devServer.app.use((req, res, next) => {
          if (req.url && req.url.endsWith('.wasm')) {
            res.setHeader('Content-Type', 'application/wasm')
          }
          next()
        })
      }
      return middlewares
    },
  },

  resolve: {
    extensions: ['.js', '.jsx', '.json', '.mjs', '.wasm'],
    alias: aliases,
    fallback: {
      stream: require.resolve('stream-browserify'),
      vm: require.resolve('vm-browserify'),
      process: require.resolve('process/browser.js'),
      buffer: require.resolve('buffer'),
      crypto: require.resolve('crypto-browserify'),
    },
  },

  module: {
    rules: [
      // JavaScript/JSX
      {
        test: /\.(js|jsx|mjs)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                { targets: { browsers: ['last 2 versions'] } },
              ],
              ['@babel/preset-react', { runtime: 'automatic' }],
            ],
            cacheDirectory: true,
          },
        },
      },
      // Fix for ESM modules requiring fully specified extensions
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
      // CSS
      {
        test: /\.module\.css$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              esModule: true,
              modules: {
                namedExport: false,
                exportLocalsConvention: 'asIs',
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      // SVG as React component
      {
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              svgo: true,
              svgoConfig: {
                plugins: [
                  {
                    name: 'preset-default',
                    params: {
                      overrides: {
                        removeViewBox: false,
                      },
                    },
                  },
                  {
                    name: 'removeDimensions',
                    active: true,
                  },
                ],
              },
            },
          },
          'url-loader',
        ],
      },
      // Images
      {
        test: /\.(png|jpg|jpeg|gif|ico|webp|bmp)$/,
        type: 'asset/resource',
      },
      // Fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/media/[name].[hash:8][ext]',
        },
      },
      // WebAssembly
      {
        test: /\.wasm$/,
        type: 'asset/resource',
        generator: {
          filename: '[name].[contenthash:8][ext]',
        },
      },
    ],
  },

  plugins: [
    // HTML template
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      inject: true,
      minify: isDevelopment
        ? false
        : {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
            removeStyleLinkTypeAttributes: true,
            keepClosingSlash: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true,
          },
    }),

    // CSS extraction for production
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
    }),

    // Copy static files
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: '',
          globOptions: {
            ignore: ['**/index.html'],
          },
        },
      ],
    }),

    // Environment variables
    new Dotenv({
      path: `./.env${isDevelopment ? '' : '.production'}`,
      systemvars: true,
      silent: true,
      ignoreStub: true,
    }),

    // Map node: scheme imports (e.g. node:crypto) to browser polyfills
    new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
      resource.request = resource.request.replace(/^node:/, '')
    }),

    // Provide polyfills
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],

  // WebAssembly experiments
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true,
  },

  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },

  // Suppress performance hints in development
  performance: {
    hints: isDevelopment ? false : 'warning',
    maxAssetSize: 512000,
    maxEntrypointSize: 512000,
  },

  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
}
