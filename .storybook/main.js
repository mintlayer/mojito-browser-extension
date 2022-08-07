const path = require('path')

const resolve = (dir) => path.resolve(__dirname, dir)

const projectAlias = {
  '@BasicComponents': resolve('../src/components/basic/index.js'),
  '@ComposedComponents': resolve('../src/components/composed/index.js'),
  '@LayoutComponents': resolve('../src/components/layouts/index.js'),
  '@ContainerComponents': resolve('../src/components/containers/index.js'),
  '@Assets': resolve('../src/assets'),
  '@Contexts': resolve('../src/contexts/index.js'),
  '@Hooks': resolve('../src/hooks/index.js'),
  '@Pages': resolve('../src/pages/index.js'),
  '@APIs': resolve('../src/services/API/index.js'),
  '@Cryptos': resolve('../src/services/Crypto/index.js'),
  '@Databases': resolve('../src/services/Database/index.js'),
  '@Entities': resolve('../src/services/Entity/index.js'),
  '@Helpers': resolve('../src/utils/Helpers/index.js'),
  '@Constants': resolve('../src/utils/Constants/index.js'),
  '@TestData': resolve('../src/utils/TestData/index.js'),
}

module.exports = {
  features: {
    previewMdx2: true,
  },
  stories: [
    '../src/*.stories.mdx',
    '../src/**/*.stories.mdx',
    '../src/**/*.stories.js',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-viewport',
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-backgrounds',
    '@storybook/addon-toolbars',
    '@storybook/addon-measure',
    '@storybook/addon-outline',
    '@storybook/addon-actions',
    '@storybook/addon-a11y',
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-webpack5',
  },
  typescript: { reactDocgen: false },
  webpackFinal: async (config, { configType }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...projectAlias,
    }

    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test.test('.svg'),
    )
    fileLoaderRule.exclude = /\.svg$/
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack', 'url-loader'],
    })

    return config
  },
}
