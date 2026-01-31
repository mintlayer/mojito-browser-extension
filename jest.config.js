require('dotenv').config()

module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/', 'src/pages'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-router|react-router-dom|@remix-run|date-fns|konva|react-konva|@mintlayer)/)',
  ],
  moduleNameMapper: {
    '^.+\\.svg$': '<rootDir>/src/tests/mock/svgMock.js',
    '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^.+\\.(jpg|jpeg|png|gif|webp|ico|bmp|woff|woff2|ttf|eot|otf)$':
      '<rootDir>/src/tests/mock/fileMock.js',
    '^@Assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@BasicComponents$': '<rootDir>/src/components/basic/index.js',
    '^@ComposedComponents$': '<rootDir>/src/components/composed/index.js',
    '^@ContainerComponents$': '<rootDir>/src/components/containers/index.js',
    '^@LayoutComponents$': '<rootDir>/src/components/layouts/index.js',
    '^@Constants$': '<rootDir>/src/utils/Constants/index.js',
    '^@Helpers$': '<rootDir>/src/utils/Helpers/index.js',
    '^@TestData$': '<rootDir>/src/utils/TestData/index.js',
    '^@Hooks$': '<rootDir>/src/hooks/index.js',
    '^@Contexts$': '<rootDir>/src/contexts/index.js',
    '^@Databases$': '<rootDir>/src/services/Database/index.js',
    '^@Cryptos$': '<rootDir>/src/services/Crypto/index.js',
    '^@Entities$': '<rootDir>/src/services/Entity/index.js',
    '^@APIs$': '<rootDir>/src/services/API/index.js',
    '^@Storage$': '<rootDir>/src/services/Storage/index.js',
    '^@Version$': '<rootDir>/src/version/version.js',
    '^d3$': '<rootDir>/node_modules/d3/dist/d3.min.js',
    '^react-router$':
      '<rootDir>/node_modules/react-router/dist/development/index.js',
    '^react-router/dom$':
      '<rootDir>/node_modules/react-router/dist/development/dom-export.js',
    '^react-router-dom$':
      '<rootDir>/node_modules/react-router-dom/dist/index.js',
    '^src/(.*)$': '<rootDir>/src/$1',
    '.*wasm_wrappers.js': '<rootDir>/src/tests/mock/wasmCrypro/wasmCrypto.js',
  },
  collectCoverageFrom: ['!src/pages'],
  coveragePathIgnorePatterns: [
    'index.js',
    './src/index.js',
    './src/pages',
    './src/contexts/AccountProvider/AccountProvider.js',
    './src/utils/Constants/EnvironmentVars.js',
    './src/utils/reportWebVitals.js',
    './src/services/Crypto/BTC/BTC.worker.js',
    './src/services/Crypto/Cipher/Cipher.worker.js',
    './src/services/Entity/Account/Account.worker.js',
    './src/utils/TestData/testTransactions.json',
    './src/utils/TestData/*',
    './src/assets/images/*',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
}
