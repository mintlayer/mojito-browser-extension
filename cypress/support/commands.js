import txsEmpty from '../fixtures/empty-txs.json'
import utxoEmpty from '../fixtures/empty-utxo.json'

import rate from '../fixtures/rate-current.json'
import rate1Day from '../fixtures/rate-1day.json'
import rateHist from '../fixtures/rate-history.json'

const txsList = [txsEmpty]
const utxoList = [utxoEmpty]

Cypress.Commands.add('interceptAll', (index = 0) => {
  cy.intercept('**/address/**/txs', txsList[index]).as('txs')
  cy.intercept('**/address/**/utxo', utxoList[index]).as('utxo')
  cy.intercept('**/getCurrentRate/**', rate).as('rate')
  cy.intercept('**/getOneDayAgoRate/**', rate1Day).as('rateD1')
  cy.intercept('**/getOneDayAgoHist/**', rateHist).as('rateAll')
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

Cypress.Commands.add('restoreAccount', (name, password, words) => {
  cy.contains('button', 'Restore').click()

  cy.setAccount(name)
  cy.get('input[placeholder="Password"]').type(password)
  cy.contains('button', 'Create').click()

  cy.contains('button', 'I have them').click()
  cy.writeWords('input', words)
  cy.contains('button', 'Confirm').click()
})

Cypress.Commands.add('logout', () => {
  cy.get('button[class="btn logout alternate"]').click()
})
