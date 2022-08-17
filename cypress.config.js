const { defineConfig } = require('cypress')

module.exports = defineConfig({
  env: {
    baseUrl: 'http://localhost:8000',
  },
  e2e: {
    setupNodeEvents(on, config) {},
  },
})
