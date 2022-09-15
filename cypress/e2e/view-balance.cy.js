import { deleteDatabase } from './utils'

describe(
  'View balance page',
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
      cy.restoreDb()
    })

    describe('Account NewOne view balance', () => {
      beforeEach(function () {
        cy.visit(Cypress.env('baseUrl'))
        cy.wait(1000)
        cy.loginWallet(Cypress.env('newone'))
        cy.getAccess(Cypress.env('newone')).then((access) => {
          return cy.wrap(access).as('access')
        })
      })

      it('checks Empty', function () {
        cy.contains(this.access.name).should('be.visible')
        cy.contains('Bitcoin (BTC)').should('be.visible')
        cy.contains('Mintlayer (MLT)').should('be.visible')

        cy.contains('Bitcoin').should('be.visible')
        cy.contains('Mintlayer').should('be.visible')

        cy.get('button[class="btn logout alternate"]').should('be.visible')

        cy.contains('li', 'BTC').should('be.visible')
      })

      it('click in BTC detail', function () {
        cy.contains(this.access.name).should('be.visible')
        cy.contains('li', 'BTC')
          .click()
          .then(() => {
            cy.get(this.access.name).should('not.exist')
          })
      })
    })

    describe('Account Sender view balance', () => {
      beforeEach(() => {
        cy.visit(Cypress.env('baseUrl'))
        cy.loginWallet(Cypress.env('sender'))
      })

      it('checks Sender balance', () => {
        cy.contains('Bitcoin (BTC)').should('be.visible')
        cy.contains('Mintlayer (MLT)').should('be.visible')
      })
    })

    describe('Receiver account view balance', () => {
      beforeEach(() => {
        cy.visit(Cypress.env('baseUrl'))
        cy.loginWallet(Cypress.env('receiver'))
      })

      it('checks Receiver balance', () => {
        cy.contains('Bitcoin (BTC)').should('be.visible')
        cy.contains('Mintlayer (MLT)').should('be.visible')
      })
    })
  },
)
