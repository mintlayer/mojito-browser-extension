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

  describe('Account NewOne view balance', () => {
    let _name
    beforeEach(() => {
      cy.visit(Cypress.env('baseUrl'))
      const { name, password } = wallets[0].access
      cy.login(name, password, 0)
      _name = name
    })

    it('checks Empty', () => {
      cy.contains(_name).should('be.visible')
      cy.contains('Bitcoin (BTC)').should('be.visible')
      cy.contains('Mintlayer (MLT)').should('be.visible')

      cy.contains('Bitcoin').should('be.visible')
      cy.contains('Mintlayer').should('be.visible')

      cy.get('button[class="btn logout alternate"]').should('be.visible')

      cy.contains('li', 'BTC').should('be.visible')
    })

    it('click in BTC detail', () => {
      cy.contains(_name).should('be.visible')
      cy.contains('li', 'BTC')
        .click()
        .then(() => {
          cy.get(_name).should('not.exist')
        })
    })
  })

  describe('Account Sender view balance', () => {
    beforeEach(() => {
      cy.visit(Cypress.env('baseUrl'))
      const { name, password } = wallets[1].access
      cy.login(name, password, 1)
    })

    it('checks Sender balance', () => {
      cy.contains('Bitcoin (BTC)').should('be.visible')
      cy.contains('Mintlayer (MLT)').should('be.visible')
    })
  })

  describe('Receiver account view balance', () => {
    beforeEach(() => {
      cy.visit(Cypress.env('baseUrl'))
      const { name, password } = wallets[2].access
      cy.login(name, password, 2)
    })

    it('checks Receiver balance', () => {
      cy.contains('Bitcoin (BTC)').should('be.visible')
      cy.contains('Mintlayer (MLT)').should('be.visible')
    })
  })
})
