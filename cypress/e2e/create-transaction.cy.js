describe(
  'Create transaction page',
  {
    requestTimeout: 10000,
  },
  () => {
    before(function () {
      cy.deleteDatabase()
      cy.clearLocalStorage()
      cy.wrap(Cypress.env('login')).as('login')
      cy.wrap(Cypress.env('receiver')).as('receiver')
      const baseUrl = Cypress.env('baseUrl')
      cy.wrap(baseUrl).as('baseUrl')

      cy.visit(baseUrl)
      cy.restoreDb()
    })

    beforeEach(function () {
      cy.visit(this.baseUrl)
      cy.wait(1000)
      cy.loginWallet(this.login)
      cy.getAddress(this.login).as('from')
      cy.getAddress(this.receiver).as('to')

      cy.wait(1000)
      cy.contains('li', 'BTC').click()
      cy.contains('Send').siblings('button').click()
    })

    it('Send and receive amount', function () {
      let _txid
      const _amount = '0,00001'
      const _fee = '30'
      cy.wait('@feeEstimates').then(() => {})
      cy.wait(1000)
      cy.contains('Send to').siblings('input').type(this.to.address)
      cy.get('input[id="amount"]').type(_amount)
      cy.get('input[id="fee"]').clear().type(_fee)

      cy.contains('button', 'Send').click()

      cy.contains('Send to').should('be.visible')
      cy.contains(this.to.address).should('be.visible')
      cy.contains('Amount').should('be.visible')
      cy.contains(_amount).should('be.visible')
      cy.contains('Total fee').should('be.visible')
      cy.contains('button', 'Cancel').should('be.visible')
      cy.contains('button', 'Confirm').click()

      cy.contains('Enter your password').should('be.visible')

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
