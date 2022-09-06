import { deleteDatabase } from './utils'
import { wallets } from '../fixtures/accounts.json'

describe('View Account page', () => {
  before(() => {
    deleteDatabase()
    cy.clearLocalStorage()

    cy.visit(Cypress.env('baseUrl'))
    cy.restoreAccount(
      wallets[0].access.name,
      wallets[0].access.password,
      wallets[0].account.words,
    )
  })

  beforeEach(() => {
    cy.visit(Cypress.env('baseUrl'))
    cy.visit(Cypress.env('baseUrl'))
    const { name, password } = wallets[0].access
    cy.login(name, password, 0)

    cy.contains('li', 'BTC').click()
    cy.contains('Receive').siblings('button').click()
  })

  it('checks', () => {
    cy.contains('Address').should('be.visible')
    cy.contains(wallets[0].account.address)

    cy.contains('button', 'Copy Address').should('be.visible')
    cy.get('svg').should('be.visible')

    cy.get('button[class="btn popupCloseButton alternate"]').should(
      'be.visible',
    )
  })

  it('click on Copy Address', () => {
    cy.contains('button', 'Copy Address').focus().click()
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq(wallets[0].account.address)
      })
    })
    cy.wait(1000)
    cy.get('button[class="btn popupCloseButton alternate"]').click()
  })
})
