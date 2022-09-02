import { deleteDatabase } from './utils'
import { wallets } from '../fixtures/accounts.json'

describe('View transaction detail page', () => {
  before(() => {
    deleteDatabase()
    cy.clearLocalStorage()

    cy.visit(Cypress.env('baseUrl'))
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

  describe('Account Sender with transaction detail', () => {
    before(() => {
      cy.visit(Cypress.env('baseUrl'))
      const { name, password } = wallets[1].access
      cy.login(name, password, 1)
      cy.contains('li', 'BTC').click()
      cy.get('li[class="transaction"]').first().click()
    })

    it('checks', () => {
      cy.contains('To:').should('be.visible')
      cy.contains('Date:').should('be.visible')
      cy.contains('Amount:').should('be.visible')
      cy.contains('Tx:').should('be.visible')
      cy.contains('button', 'Open In Blockchain').should('be.visible')

      cy.get('button[class="btn popupCloseButton alternate"]').click()
    })

    after(() => {
      cy.get('button[class="btn logout alternate"]').click()
    })
  })

  describe('Account Receiver with transaction detail', () => {
    before(() => {
      cy.visit(Cypress.env('baseUrl'))
      const { name, password } = wallets[2].access
      cy.login(name, password, 2)
      cy.contains('li', 'BTC').click()
      cy.get('li[class="transaction"]').first().click()
    })

    it('checks', () => {
      cy.contains('From:').should('be.visible')
      cy.contains('Date:').should('be.visible')
      cy.contains('Amount:').should('be.visible')
      cy.contains('Tx:').should('be.visible')
      cy.contains('button', 'Open In Blockchain').should('be.visible')

      cy.get('button[class="btn popupCloseButton alternate"]').click()
    })

    after(() => {
      cy.get('button[class="btn logout alternate"]').click()
    })
  })
})
