describe('View Account page', () => {
  before(function () {
    cy.deleteDatabase()
    cy.clearLocalStorage()

    const baseUrl = Cypress.env('baseUrl')
    cy.wrap(baseUrl).as('baseUrl')
    cy.wrap(Cypress.env('login')).as('login')

    Cypress.on('window:before:load', (win) => {
      let copyText

      if (!win.navigator.clipboard) {
        win.navigator.clipboard = {
          __proto__: {},
        }
      }

      win.navigator.clipboard.__proto__.writeText = (text) => (copyText = text)
      win.navigator.clipboard.__proto__.readText = () => copyText
    })

    cy.visit(baseUrl)
    cy.restoreDb()
  })

  beforeEach(function () {
    cy.visit(this.baseUrl, {
      onBeforeLoad(win) {
        cy.spy(win.navigator.clipboard, 'writeText').as('copy')
      },
    })
    cy.wait(1000)
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
})
