import { deleteDatabase } from './utils'
import { wallets } from '../fixtures/accounts.json'

describe('Create transaction page', () => {
  before(() => {
    deleteDatabase()
    cy.clearLocalStorage()

    cy.visit(Cypress.env('baseUrl'))
    cy.restoreAccount(
      wallets[1].access.name,
      wallets[1].access.password,
      wallets[1].account.words,
      -1,
    )
    cy.visit(Cypress.env('baseUrl'))
    cy.contains('button', 'Create Wallet').click()
    cy.restoreAccount(
      wallets[2].access.name,
      wallets[2].access.password,
      wallets[2].account.words,
      -1,
    )
  })

  let _password

  beforeEach(() => {
    cy.visit(Cypress.env('baseUrl'))
    const { name, password } = wallets[1].access
    cy.login(name, password, -1)
    _password = password
    cy.contains('li', 'BTC').click()
    cy.contains('Send').siblings('button').click()
  })

  it('Send and receive amount', () => {
    let _txid
    const _from = wallets[1].account.address
    const _amount = '0,000001'
    cy.contains('Send to').siblings('input').type(wallets[2].account.address)
    cy.get('input[id="amount"]').type(_amount)
    cy.contains('button', 'high').click()
    cy.contains('button', 'Send').click()

    cy.contains('Send to').should('be.visible')
    cy.contains(wallets[2].account.address).should('be.visible')
    cy.contains('Amount').should('be.visible')
    cy.contains(_amount).should('be.visible')
    cy.contains('Total fee').should('be.visible')
    cy.contains('button', 'Cancel').should('be.visible')
    cy.contains('button', 'Confirm').click()

    cy.contains('Insert your password').should('be.visible')

    cy.get('input[placeholder="Password"]').type(_password)
    cy.contains('button', 'Send Transaction').click()

    cy.wait(1000)

    cy.contains('Your transaction was sent').should('be.visible')
    cy.contains('txid').should('be.visible')
    cy.contains('h3', 'txid:')
      .first()
      .invoke('text')
      .then((t) => {
        _txid = t.substring(6)
      })
    cy.contains('button', 'Back to Wallet').click()

    cy.logout()
    cy.wait(15000)

    cy.login(wallets[2].access.name, wallets[2].access.password, -1)
    cy.contains('li', 'BTC').click()

    cy.get('div.transaction-logo-type.false')
      .first()
      .should('be.visible')
      .click()

    cy.wait(1000)

    cy.contains('Tx:')
      .siblings('div')
      .invoke('text')
      .then((text) => {
        expect(text.toString().trim()).equal(_txid)
      })
    cy.contains('From:')
      .siblings('div')
      .invoke('text')
      .then((text) => {
        expect(text.toString().trim()).equal(_from)
      })
    cy.contains('Amount:')
      .parent()
      .invoke('text')
      .then((text) => {
        expect(text.toString().trim()).contains(_amount)
      })

    cy.contains('button', 'Open In Blockchain').should('be.visible')
    cy.get('button[class="btn popupCloseButton alternate"]').click()
  })
})
