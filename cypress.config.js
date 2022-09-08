const { defineConfig } = require('cypress')

module.exports = defineConfig({
  projectId: 'sk4o12',
  env: {
    baseUrl: 'http://localhost:8000',
    host: 'testnet',
  },
  e2e: {
    setupNodeEvents(on, config) {
      console.log('setupNodeEvents')
    },
  },
  viewportWidth: 800,
  viewportHeight: 600,
})
