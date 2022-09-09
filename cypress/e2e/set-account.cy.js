import { deleteDatabase } from './utils'

describe(
  'set Account page',
  {
    env: {
      wallet: Cypress.env('creation') || 'NewOne',
    },
  },
  () => {
    before(() => {
      deleteDatabase()
      cy.getAccess(Cypress.env('wallet')).then((access) => {
        return cy.wrap(access).as('access')
      })
    })

    beforeEach(() => {
      cy.visit(Cypress.env('baseUrl'))
      cy.contains('button', 'Create').click()
    })

    it('check and click on button Account Name', function () {
      cy.contains('li.step.active', 'Account Name').should('be.visible')
      cy.contains('Create a name to your account').should('be.visible')
      cy.contains('Mojito').should('be.visible')

      cy.setAccount(this.access.name)
      cy.contains('button', 'Continue').should('be.visible')

      cy.contains('li.step.false', 'Account Name').should('be.visible')
    })
  },
)
