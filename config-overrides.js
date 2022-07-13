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
  })
  config.resolve.fallback = fallback
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
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
