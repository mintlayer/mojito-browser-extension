import { deleteDatabase } from './utils'

describe(
  'Create transaction page',
  {
    requestTimeout: 10000,
    env: {
      sender: Cypress.env('login') || 'Sender',
      receiver: Cypress.env('receiver') || 'Receiver',
    },
  },
  () => {
    before(function () {
      deleteDatabase()
      cy.clearLocalStorage()
      cy.wrap(Cypress.env('sender')).as('sender')
      cy.wrap(Cypress.env('receiver')).as('receiver')
      cy.visit(Cypress.env('baseUrl'))
      cy.restoreWallet(Cypress.env('sender'))
      cy.contains('button', 'Create Wallet').click()
      cy.restoreWallet(Cypress.env('receiver'))
    })

    beforeEach(function () {
      cy.visit(Cypress.env('baseUrl'))
      cy.loginWallet(this.sender)
      cy.getAddress(this.sender).as('from')
      cy.getAddress(this.receiver).as('to')

      cy.contains('li', 'BTC').click()
      cy.contains('Send').siblings('button').click()
    })

    it('Send and receive amount', function () {
      let _txid
      const _amount = '0,000001'
      cy.wait('@feeEstimates').then(() => {})
      cy.wait(1000)
      cy.contains('Send to').siblings('input').type(this.to.address)
      cy.get('input[id="amount"]').type(_amount)

      cy.contains('button', 'high').click()
      cy.contains('button', 'Send').click()

      cy.contains('Send to').should('be.visible')
      cy.contains(this.to.address).should('be.visible')
      cy.contains('Amount').should('be.visible')
      cy.contains(_amount).should('be.visible')
      cy.contains('Total fee').should('be.visible')
      cy.contains('button', 'Cancel').should('be.visible')
      cy.contains('button', 'Confirm').click()

      cy.contains('Insert your password').should('be.visible')

      cy.get('input[placeholder="Password"]').type(this.password)
      cy.contains('button', 'Send Transaction').click()

      cy.wait('@txid').then((x) => {})
      cy.wait('@txidHex').then((x) => {})

      cy.wait(10000)

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

      cy.loginWallet(this.receiver)
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
          expect(text.toString().trim()).equal(this.from.address)
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
  },
)
