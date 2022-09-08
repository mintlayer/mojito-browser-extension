import rate from '../fixtures/rate-current.json'
import rate1Day from '../fixtures/rate-1day.json'
import rateHist from '../fixtures/rate-history.json'

import rateUpper from '../fixtures/rate-current-upper.json'

import feeEstimates from '../fixtures/fee-estimates.json'

import txid from '../fixtures/txid.json'

function interceptAndSave(path, file, as) {
  cy.intercept(path, (req) => {
    // override the previously-declared stub to just continue the request instead of stubbing
    return req.continue((res) => {
      if (res.body.status === 'failed') {
        // sends a fixture body instead of the existing 'res.body'
        // res.send({ fixture: 'success.json' })
        console.log('error', path, res.body)
      }

      // cy.exec().then(() => cy.writeFile('cypress/fixtures/' + file, res.body))
      if (res.body) {
        cy.now('writeFile', 'cypress/fixtures/' + file, res.body)
        res.send(res.body)
      } else {
        console.log('empty response', path, file, as)
        res.send()
      }
    })
  }).as(as)
}

Cypress.Commands.add('interceptAll', (name) => {
  if (Cypress.env('host') === 'none') {
    console.log('intercept and use from local', name)
    cy.intercept('**/address/*/txs', `cypress/fixtures/${name}/txs.json`).as(
      'txs',
    )
    cy.intercept('**/address/*/utxo', `cypress/fixtures/${name}/utxo.json`).as(
      'utxo',
    )
    cy.intercept(
      '**/getCurrentRate/BTC/USD',
      `cypress/fixtures/${name}/rateUpper.json`,
    ).as('rateUpper')
    cy.intercept(
      '**/getCurrentRate/btc/usd',
      `cypress/fixtures/${name}/rate.json`,
    ).as('rate')
    cy.intercept(
      '**/getOneDayAgoRate/**',
      `cypress/fixtures/${name}/rateD1.json`,
    ).as('rateD1')
    cy.intercept(
      '**/getOneDayAgoHist/**',
      `cypress/fixtures/${name}/rateAll.json`,
    ).as('rateAll')
    cy.intercept(
      '**/fee-estimates',
      `cypress/fixtures/${name}/feeEstimates.json`,
    ).as('feeEstimates') // JSON.stringify(feeEstimates)
    cy.intercept('**/tx/*', `cypress/fixtures/${name}/txid.json`).as('txid')
    cy.intercept('**/tx/*/hex', `cypress/fixtures/${name}/txidHex.txt`).as(
      'txidHex',
    )
    cy.intercept('POST', '**/tx', `cypress/fixtures/${name}/tx.txt`).as('tx')
    cy.intercept('POST', '**/*', (req) => {
      console.log('intercept-req', req)
    })
  } else {
    console.log('intercept and save from host', Cypress.env('host'))
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
  cy.waitAll()
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
  cy.waitAll()
  cy.logout()
  cy.contains(name).should('be.visible')
})
