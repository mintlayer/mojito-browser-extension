import { deleteDatabase } from './utils'
import { wallets } from '../fixtures/accounts.json'

describe('login Account wallet', () => {
  before(() => {
    deleteDatabase()
    cy.clearLocalStorage()

    cy.visit(Cypress.env('baseUrl'))
    const { name, password } = wallets[0].access
    cy.restoreAccount(name, password, wallets[0].account.words)
  })

  beforeEach(() => {
    cy.visit(Cypress.env('baseUrl'))
  })

  it('login Account and logout Account', () => {
    const {
      access: { name, password },
      account: { address },
    } = wallets[0]
    cy.contains(name).should('be.visible')
    cy.contains(name).click()
    cy.interceptAll()

    cy.get('input[placeholder="Password"]').type(password)
    cy.contains('button', 'Log In').click()

    cy.get('button[class="btn logout alternate"]')
      .should('be.visible')
      .then(() => {
        expect(localStorage.getItem('unlockedAccount')).be.eq(
          `{"address":"${address}","id":1,"name":"${name}"}`,
        )
      })

    cy.get('button[class="btn logout alternate"]').click()
    cy.contains(name)
      .should('be.visible')
      .then(() => {
        expect(localStorage.getItem('unlockedAccount')).be.eq(null)
      })
  })
})
