const webpack = require('webpack')
const Dotenv = require('dotenv-webpack')
const {
  aliasDangerous,
  configPaths,
} = require('react-app-rewire-alias/lib/aliasDangerous')

module.exports = function overrideConf(config) {
  const fallback = config.resolve.fallback || {}
  Object.assign(fallback, {
    stream: require.resolve('stream-browserify'),
    vm: require.resolve('vm-browserify'),
    process: require.resolve('process/browser.js'),
  })
  config.resolve.fallback = fallback

  // Fix for ESM modules requiring fully specified extensions
  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
      fullySpecified: false,
    },
  })

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
    new Dotenv({
      path: `./.env${
        process.env.NODE_ENV === 'production' ? '.production' : ''
      }`,
      systemvars: true,
      silent: true,
      ignoreStub: true,
    }),
  ])

  aliasDangerous({
    ...configPaths('./jsconfig.json'),
  })(config)

  return config
}
