import txsEmpty from '../fixtures/txs-empty.json'
import utxoEmpty from '../fixtures/utxo-empty.json'

import txsSender from '../fixtures/txs-sender.json'
import utxoSender from '../fixtures/utxo-sender.json'

import txsReceiver from '../fixtures/txs-receiver.json'
import utxoReceiver from '../fixtures/utxo-receiver.json'

import rate from '../fixtures/rate-current.json'
import rate1Day from '../fixtures/rate-1day.json'
import rateHist from '../fixtures/rate-history.json'

const txsList = [txsEmpty, txsSender, txsReceiver]
const utxoList = [utxoEmpty, utxoSender, utxoReceiver]

Cypress.Commands.add('interceptAll', (index = 0) => {
  if (index !== -1) {
    cy.intercept('**/address/**/txs', txsList[index]).as('txs')
    cy.intercept('**/address/**/utxo', utxoList[index]).as('utxo')
    cy.intercept('**/getCurrentRate/**', rate).as('rate')
    cy.intercept('**/getOneDayAgoRate/**', rate1Day).as('rateD1')
    cy.intercept('**/getOneDayAgoHist/**', rateHist).as('rateAll')
  } else {
    cy.intercept('**/address/**/txs').as('txs')
    cy.intercept('**/address/**/utxo').as('utxo')
    cy.intercept('**/getCurrentRate/**').as('rate')
    cy.intercept('**/getOneDayAgoRate/**').as('rateD1')
    cy.intercept('**/getOneDayAgoHist/**').as('rateAll')
  }
})

Cypress.Commands.add('waitAll', () => {
  cy.wait(['@txs', '@utxo'])
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

Cypress.Commands.add('login', (name, password, intercepts = 0) => {
  cy.contains(name).should('be.visible')
  cy.contains(name).click()

  cy.interceptAll(intercepts)

  cy.get('input[placeholder="Password"]').type(password)
  cy.contains('button', 'Log In').click()
  cy.waitAll()
})

Cypress.Commands.add('logout', () => {
  cy.get('button[class="btn logout alternate"]').click()
})

Cypress.Commands.add('restoreAccount', (name, password, words, index = 0) => {
  cy.interceptAll(index)

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
