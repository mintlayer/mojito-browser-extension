import { deleteDatabase } from './utils'

describe(
  'View Account page',
  {
    env: {
      login: Cypress.env('login') || 'Receiver',
    },
  },
  () => {
    before(function () {
      deleteDatabase()
      cy.clearLocalStorage()

      cy.visit(Cypress.env('baseUrl'))
      cy.restoreWallet(Cypress.env('login'))
      cy.wrap(Cypress.env('login')).as('login')
    })

    beforeEach(function () {
      cy.visit(Cypress.env('baseUrl'), {
        onBeforeLoad(win) {
          cy.spy(win.navigator.clipboard, 'writeText').as('copy')
        },
      })
      cy.loginWallet(this.login)

      cy.contains('li', 'BTC').click()
      cy.contains('Receive').siblings('button').click()
      cy.wait(2000)
      cy.contains('Address')
        .parent()
        .get('strong')
        .invoke('text')
        .then((address) => {
          cy.setAddress(this.login, address)
          return cy.wrap(address).as('address')
        })
    })

    it('checks and click', function () {
      cy.contains('Address').should('be.visible')
      cy.contains(this.address)

      cy.contains('button', 'Copy Address').should('be.visible')
      cy.get('svg').should('be.visible')

      cy.get('button[class="btn popupCloseButton alternate"]').should(
        'be.visible',
      )

      cy.contains('button', 'Copy Address')
        .focus()
        .click()
        .wait(4000)
        .then(() => {
          cy.get('@copy').should('be.calledWithExactly', `${this.address}`)
          cy.get('button[class="btn popupCloseButton alternate"]').click()
        })
    })
  },
)
