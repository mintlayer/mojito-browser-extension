import { deleteDatabase } from './utils'

describe(
  'set password page',
  {
    env: {
      wallet: Cypress.env('creation') || 'NewOne',
    },
  },
  () => {
    before(() => {
      deleteDatabase()
    })

    beforeEach(function () {
      cy.visit(Cypress.env('baseUrl'))
      cy.contains('button', 'Create').click()
      cy.getAccess(Cypress.env('wallet')).then((access) => {
        cy.setAccount(access.name)
        return cy.wrap(access).as('access')
      })
    })

    it('displays attribute pages', () => {
      cy.contains('li.step.active', 'Account Password').should('be.visible')
      cy.contains('Create a password to your account').should('be.visible')
      cy.contains('Mojito').should('be.visible')
      cy.contains('button', 'Continue').should('be.visible')
      cy.get('input[placeholder="Password"]').should('be.visible')
    })

    it('click on continue', function () {
      cy.setPassword(this.access.password)
      cy.contains('button', 'I understand').should('be.visible')

      cy.contains('li.step.false', 'Account Password').should('be.visible')
    })
  },
)
