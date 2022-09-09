import { deleteDatabase } from './utils'

describe(
  'View transaction detail page',
  {
    env: {
      sender: Cypress.env('sender') || 'Sender',
      receiver: Cypress.env('receiver') || 'Receiver',
    },
  },
  () => {
    before(() => {
      deleteDatabase()
      cy.clearLocalStorage()

      cy.visit(Cypress.env('baseUrl'))
      cy.restoreWallet(Cypress.env('sender'))
      cy.contains('button', 'Create Wallet').click()
      cy.restoreWallet(Cypress.env('receiver'))
    })

    describe('Account Sender with transaction detail', () => {
      before(() => {
        cy.visit(Cypress.env('baseUrl'))
        cy.loginWallet(Cypress.env('sender'))
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
        cy.loginWallet(Cypress.env('receiver'))
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
  },
)
