import { deleteDatabase } from './utils'
import { wallets } from '../fixtures/accounts.json'

describe('View balance page', () => {
  before(() => {
    deleteDatabase()
    cy.clearLocalStorage()

    cy.visit(Cypress.env('baseUrl'))
    cy.restoreAccount(
      wallets[0].access.name,
      wallets[0].access.password,
      wallets[0].account.words,
    )
    cy.contains('button', 'Create Wallet').click()
    cy.restoreAccount(
      wallets[1].access.name,
      wallets[1].access.password,
      wallets[1].account.words,
    )
    cy.contains('button', 'Create Wallet').click()
    cy.restoreAccount(
      wallets[2].access.name,
      wallets[2].access.password,
      wallets[2].account.words,
    )
  })

  describe('Clean account', () => {
    beforeEach(() => {
      cy.visit(Cypress.env('baseUrl'))
      const { name, password } = wallets[0].access
      cy.login(name, password, 0)
    })

    it('checks Empty', () => {
      cy.contains('BTC').should('be.visible')
      cy.contains('USD').should('be.visible')

      cy.contains('Bitcoin').should('be.visible')
      cy.contains('Mintlayer').should('be.visible')

      cy.get('button[class="btn logout alternate"]').should('be.visible')

      cy.contains('li', 'BTC').should('be.visible')

      cy.contains('li', 'BTC').click()
      cy.contains('Send').should('be.visible')
      cy.contains('Receive').should('be.visible')
    })
  })

  describe('Sender account', () => {
    let _name
    beforeEach(() => {
      cy.visit(Cypress.env('baseUrl'))
      const { name, password } = wallets[1].access
      cy.login(name, password, 1)
      _name = name
    })

    it.only('checks Sender', () => {
      cy.contains(_name).should('be.visible')
      cy.contains('li', 'BTC').click()
      cy.contains('Send').should('be.visible')
      cy.contains('Receive').should('be.visible')

      cy.get('div.transaction-logo-type.transaction-logo-out')
        .first()
        .should('be.visible')
      cy.contains('li', 'Amount').should('be.visible')
    })
  })

  describe('Receiver account', () => {
    let _name
    beforeEach(() => {
      cy.visit(Cypress.env('baseUrl'))
      const { name, password } = wallets[2].access
      cy.login(name, password, 2)
      _name = name
    })

    it('checks Receiver', () => {
      cy.contains(_name).should('be.visible')
      cy.contains('li', 'BTC')
        .click()
        .then(() => {
          cy.contains('Send').should('be.visible')
          cy.contains('Receive').should('be.visible')

          cy.get('div.transaction-logo-type.false').first().should('be.visible')
          cy.contains('li', 'Amount').should('be.visible')
        })
    })
  })
})
