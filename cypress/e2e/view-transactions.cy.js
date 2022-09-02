import { deleteDatabase } from './utils'
import { wallets } from '../fixtures/accounts.json'

describe('View transactions page', () => {
  before(() => {
    deleteDatabase()
    cy.clearLocalStorage()

    cy.visit(Cypress.env('baseUrl'))
    cy.restoreAccount(
      wallets[0].access.name,
      wallets[0].access.password,
      wallets[0].account.words,
    )
    cy.visit(Cypress.env('baseUrl'))
    cy.contains('button', 'Create Wallet').click()
    cy.restoreAccount(
      wallets[1].access.name,
      wallets[1].access.password,
      wallets[1].account.words,
      1,
    )
    cy.visit(Cypress.env('baseUrl'))
    cy.contains('button', 'Create Wallet').click()
    cy.restoreAccount(
      wallets[2].access.name,
      wallets[2].access.password,
      wallets[2].account.words,
      2,
    )
  })

  describe('Account NewOne with no transactions', () => {
    beforeEach(() => {
      cy.visit(Cypress.env('baseUrl'))
      const { name, password } = wallets[0].access
      cy.login(name, password, 0)
      cy.contains('li', 'BTC').click()
    })

    it('No transaction in this wallet', () => {
      cy.contains('No transactions in this wallet').should('be.visible')
    })

    afterEach(() => {
      cy.get('button[class="btn logout alternate"]').click()
    })
  })

  describe('Account Sender with send transactions', () => {
    beforeEach(() => {
      cy.visit(Cypress.env('baseUrl'))
      const { name, password } = wallets[1].access
      cy.login(name, password, 1)
      cy.contains('li', 'BTC').click()
    })

    it('checks Send transactions', () => {
      cy.get('button[class="btn logout alternate"]').should('be.visible')
      cy.get('button[class="btn backButton alternate"]').should('be.visible')

      cy.contains('BTC').should('be.visible')
      cy.contains('USD').should('be.visible')
      cy.contains('Send').should('be.visible')
      cy.contains('Receive').should('be.visible')

      cy.get('div.transaction-logo-type.transaction-logo-out')
        .first()
        .should('be.visible')
      cy.contains('li', 'Amount').should('be.visible')
    })

    it('check link transaction detail', () => {
      cy.get('div.transaction-logo-type.transaction-logo-out')
        .first()
        .click()
        .then(() => {
          cy.wait(1000)
          cy.contains('button', 'Open In Blockchain').should('be.visible')
          cy.get('button.btn.popupCloseButton.alternate').click()
        })
    })

    afterEach(() => {
      cy.get('button[class="btn logout alternate"]').click()
    })
  })

  describe('Account Receiver with received transactions', () => {
    beforeEach(() => {
      cy.visit(Cypress.env('baseUrl'))
      const { name, password } = wallets[2].access
      cy.login(name, password, 2)
      cy.contains('li', 'BTC').click()
    })

    it('checks received transactions', () => {
      cy.get('div.transaction-logo-type.false').first().should('be.visible')
      cy.contains('li', 'Amount').should('be.visible')
    })
  })
})
