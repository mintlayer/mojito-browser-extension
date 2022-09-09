Cypress.Commands.add('getAccess', (folderName) => {
  return cy.fixture(`${folderName}/access.json`)
})

Cypress.Commands.add('getAccount', (folderName) => {
  return cy.fixture(`${folderName}/account.json`)
})
Cypress.Commands.add('getAddress', (folderName) => {
  return cy.fixture(`${folderName}/address.json`)
})

Cypress.Commands.add('setAddress', (folderName, address) => {
  if (Cypress.env('overwrite') === true) {
    cy.writeFile(
      `cypress/fixtures/${folderName}/address.json`,
      JSON.stringify({
        address,
      }),
    )
  }
})

Cypress.Commands.add('setAccess', (folderName) => {
  if (Cypress.env('overwrite') === true) {
    cy.writeFile(
      `cypress/fixtures/${folderName}/access.json`,
      JSON.stringify({
        name: folderName,
        password: `Mintlayer,1${folderName}`,
      }),
    )
  }
})

Cypress.Commands.add('saveAccount', (folderName, account) => {
  Cypress.env('overwrite') === true &&
    cy.writeFile(
      `cypress/fixtures/${folderName}/account.json`,
      JSON.stringify(account),
    )
})

function interceptAndSave(path, file, as) {
  if (Cypress.env('overwrite') === true) {
    cy.intercept(path, (req) => {
      return req.continue((res) => {
        if (res.body.status === 'failed') {
          console.log('error', path, res.body)
        }

        if (res.body) {
          cy.now('writeFile', 'cypress/fixtures/' + file, res.body)
          res.send(res.body)
        } else {
          console.log('empty response', path, file, as)
          res.send()
        }
      })
    }).as(as)
  } else {
    cy.intercept(path).as(as)
  }
}

function interceptAndUse(path, file, as) {
  cy.intercept(path, (req) => {
    req.reply({
      fixture: file,
    })
  }).as(as)
}

Cypress.Commands.add('interceptAll', (name) => {
  if (Cypress.env('host') === 'none') {
    console.log('intercept and use from local', name)
    interceptAndUse('**/address/*/txs', `${name}/txs.json`, 'txs')
    interceptAndUse('**/address/*/utxo', `${name}/utxo.json`, 'utxo')
    interceptAndUse(
      '**/getCurrentRate/BTC/USD',
      `${name}/rateUpper.json`,
      'rateUpper',
    )
    interceptAndUse('**/getCurrentRate/btc/usd', `${name}/rate.json`, 'rate')
    interceptAndUse('**/getOneDayAgoRate/**', `${name}/rateD1.json`, 'rateD1')
    interceptAndUse('**/getOneDayAgoHist/**', `${name}/rateAll.json`, 'rateAll')
    interceptAndUse(
      '**/fee-estimates',
      `${name}/feeEstimates.json`,
      'feeEstimates',
    ) // JSON.stringify(feeEstimates)
    interceptAndUse('**/tx/*', `${name}/txid.json`, 'txid')
    interceptAndUse('**/tx/*/hex', `${name}/txidHex.txt`, 'txidHex')
    interceptAndUse('POST', '**/tx', `${name}/tx.txt`, 'tx')
    cy.intercept('POST', '**/*', (req) => {
      console.log('intercept-req', req)
    })
  } else {
    interceptAndSave('**/address/**/txs', `${name}/txs.json`, 'txs')
    interceptAndSave('**/address/**/utxo', `${name}/utxo.json`, 'utxo')
    interceptAndSave('**/getCurrentRate/btc/usd', `${name}/rate.json`, 'rate')
    interceptAndSave(
      '**/getCurrentRate/BTC/USD',
      `${name}/rateUpper.json`,
      'rateUpper',
    )
    interceptAndSave('**/getOneDayAgoRate/**', `${name}/rateD1.json`, 'rateD1')
    interceptAndSave(
      '**/getOneDayAgoHist/**',
      `${name}/rateAll.json`,
      'rateAll',
    )
    interceptAndSave(
      '**/fee-estimates',
      `${name}/feeEstimates.json`,
      'feeEstimates',
    )
    interceptAndSave('**/tx/*', `${name}/txid.json`, 'txid')
    interceptAndSave('**/tx/*/hex', `${name}/txidHex.txt`, 'txidHex')
    interceptAndSave('**/tx', `${name}/tx.txt`, 'tx')
  }
})

Cypress.Commands.add('waitAll', () => {
  cy.wait('@txs')
  cy.wait('@utxo')
  cy.wait(['@rate', '@rateD1', '@rateAll'])
})

Cypress.Commands.add('setAccount', (name) => {
  cy.get('input[placeholder="Account Name"]').type(name)
  cy.contains('button', 'Continue').click()
})

Cypress.Commands.add('setPassword', (password) => {
  cy.get('input[placeholder="Password"]').type(password)
  cy.contains('button', 'Continue').click()
})

Cypress.Commands.add('setAccountAndPassword', (name, password) => {
  cy.setAccount(name)
  cy.setPassword(password)
})

Cypress.Commands.add('getWords', (path) => {
  cy.get(path).first().invoke('val').should('not.be.empty')
  return cy.get(path).then(($els) => Array.from($els, (el) => el.value))
})

Cypress.Commands.add('writeWords', (path, words) => {
  cy.get(path).each((x, i, a) => {
    cy.wrap(x).type(words[i])
  })
})

Cypress.Commands.add('login', (name, password) => {
  cy.contains(name).should('be.visible')
  cy.contains(name).click()

  cy.interceptAll(name)

  cy.get('input[placeholder="Password"]').type(password)
  cy.contains('button', 'Log In').click()
  cy.wait(2000)
})

Cypress.Commands.add('logout', () => {
  cy.get('button[class="btn logout alternate"]').click()
})

Cypress.Commands.add('restoreAccount', (name, password, words) => {
  cy.interceptAll(name)

  cy.contains('button', 'Restore').click()

  cy.setAccount(name)
  cy.get('input[placeholder="Password"]').type(password)
  cy.contains('button', 'Create').click()

  cy.contains('button', 'I have them').click()
  cy.writeWords('input', words)
  cy.contains('button', 'Confirm').click()
  cy.wait(2000)
  cy.logout()
  cy.contains(name).should('be.visible')
})

Cypress.Commands.add('restoreWallet', (sender) => {
  cy.getAccess(sender)
    .then((access) =>
      cy.getAccount(sender).then(({ account }) => ({ access, account })),
    )
    .then(({ access: { name, password }, account }) =>
      cy.restoreAccount(name, password, account),
    )
})

Cypress.Commands.add('loginWallet', (sender) => {
  cy.getAccess(sender).then(({ name, password }) => {
    cy.wrap(password).as('password')
    cy.login(name, password)
  })
})
