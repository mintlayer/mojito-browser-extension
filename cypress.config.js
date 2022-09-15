const { defineConfig } = require('cypress')

module.exports = defineConfig({
  projectId: 'sk4o12',
  env: {
    baseUrl: 'http://localhost:8000',
    host: 'testnet',
    BD: 'DB.json',
    overwrite: false,
    create: 'NewOne',
    wallets: 'NewOne,Sender,Receiver',
    newone: 'NewOne',
    login: 'Sender',
    receiver: 'Receiver',
  },
  e2e: {
    setupNodeEvents(on, config) {
      console.log('setupNodeEvents', config.env)
    },
  },
  viewportWidth: 800,
  viewportHeight: 600,
})
