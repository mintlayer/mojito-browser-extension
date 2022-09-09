import { deleteDatabase } from './utils'

describe(
  'Restore account page',
  {
    env: {
      wallet: Cypress.env('login') || 'NewOne',
    },
  },
  () => {
    before(function () {
      deleteDatabase()

      cy.getAccount(Cypress.env('wallet')).as('wallet')
      cy.getAccess(Cypress.env('wallet')).then((access) => {
        cy.interceptAll(access.name)
        return cy.wrap(access).as('access')
      })
    })

    beforeEach(() => {
      cy.visit(Cypress.env('baseUrl'))
    })

    it('click on Restore for NewOne', function () {
      cy.contains('button', 'Restore').click()

      cy.setAccount(this.access.name)
      cy.get('input[placeholder="Password"]').type(this.access.password)
      cy.contains('button', 'Create').click()

      cy.contains('button', 'I have them').click()
      cy.writeWords('input', this.wallet.account)
      cy.contains('button', 'Confirm').click()

      cy.wait('@utxo')
    })
  },
)
