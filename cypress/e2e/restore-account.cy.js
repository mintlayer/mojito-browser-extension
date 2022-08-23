import { deleteDatabase } from './utils'
import { user } from '../fixtures/accounts.json'

describe('Restore account page', () => {
  before(() => {
    deleteDatabase()

    cy.intercept('**/address/**/utxo').as('utxo')
    cy.intercept('**/address/**/txs').as('txs')
  })

  beforeEach(() => {
    cy.visit(Cypress.env('baseUrl'))
  })

  it('click on continue', () => {
    cy.contains('button', 'Restore').click()

    cy.setAccount(user.access.name)
    cy.get('input[placeholder="Password"]').type(user.access.password)
    cy.contains('button', 'Create').click()

    cy.contains('button', 'I have them').click()
    cy.writeWords('input', user.accounts[0].words)
    cy.contains('button', 'Confirm').click()

    cy.wait('@utxo')
    cy.wait('@txs')
  })
})
