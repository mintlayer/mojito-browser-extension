const webpack = require('webpack')
const Dotenv = require('dotenv-webpack')
const {
  aliasDangerous,
  configPaths,
} = require('react-app-rewire-alias/lib/aliasDangerous')

module.exports = function overrideConf(config) {
  const ENVIRONMENT = process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV

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
      path: `./.env.${ENVIRONMENT.trim()}`,
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
