const { defineConfig } = require('cypress')

module.exports = defineConfig({
  projectId: 'sk4o12',
  env: {
    baseUrl: 'http://localhost:8000',
  },
  e2e: {
    setupNodeEvents(on, config) {},
  },
  viewportWidth: 800,
  viewportHeight: 600,
})
