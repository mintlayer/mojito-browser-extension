import { deleteDatabase } from './utils'

describe(
  'View transactions page',
  {
    env: {
      newone: Cypress.env('login') || 'NewOne',
      sender: Cypress.env('sender') || 'Sender',
      receiver: Cypress.env('receiver') || 'Receiver',
    },
  },
  () => {
    before(() => {
      deleteDatabase()
      cy.clearLocalStorage()

      cy.visit(Cypress.env('baseUrl'))
      cy.restoreWallet(Cypress.env('newone'))
      cy.contains('button', 'Create Wallet').click()
      cy.restoreWallet(Cypress.env('sender'))
      cy.contains('button', 'Create Wallet').click()
      cy.restoreWallet(Cypress.env('receiver'))
      cy.wait(2000)
    })

    describe('Account NewOne with no transactions', () => {
      beforeEach(() => {
        cy.visit(Cypress.env('baseUrl'))
        cy.loginWallet(Cypress.env('newone'))
        cy.contains('li', 'BTC').click()
        cy.wait(2000)
      })

      it('No transaction in this wallet', () => {
        cy.contains('No transactions in this wallet').should('be.visible')
      })

      afterEach(() => {
        cy.get('button[class="btn logout alternate"]').click()
        cy.wait(2000)
      })
    })

    describe('Account Sender with send transactions', () => {
      beforeEach(() => {
        cy.visit(Cypress.env('baseUrl'))
        cy.loginWallet(Cypress.env('sender'))
        cy.contains('li', 'BTC').click()
        cy.wait(2000)
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
        cy.wait(2000)
      })
    })

    describe('Account Receiver with received transactions', () => {
      beforeEach(() => {
        cy.visit(Cypress.env('baseUrl'))
        cy.loginWallet(Cypress.env('receiver'))
        cy.contains('li', 'BTC').click()
        cy.wait(2000)
      })

      it('checks received transactions', () => {
        cy.get('div.transaction-logo-type.false').first().should('be.visible')
        cy.contains('li', 'Amount').should('be.visible')
      })

      afterEach(() => {
        cy.get('button[class="btn logout alternate"]').click()
        cy.wait(2000)
      })
    })
  },
)
