import { deleteDatabase } from './utils'
import { wallets } from '../fixtures/accounts.json'

describe('Restore account page', () => {
  before(() => {
    deleteDatabase()

    cy.interceptAll(0)
  })

  beforeEach(() => {
    cy.visit(Cypress.env('baseUrl'))
  })

  it('click on Restore for NewOne', () => {
    cy.contains('button', 'Restore').click()

    cy.setAccount(wallets[0].access.name)
    cy.get('input[placeholder="Password"]').type(wallets[0].access.password)
    cy.contains('button', 'Create').click()

    cy.contains('button', 'I have them').click()
    cy.writeWords('input', wallets[0].account.words)
    cy.contains('button', 'Confirm').click()

    cy.wait('@utxo')
    cy.wait('@txs')
  })
})
