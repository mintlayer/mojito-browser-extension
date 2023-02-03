describe('login Account wallet', () => {
  before(() => {
    cy.deleteDatabase()
    cy.clearLocalStorage()

    const baseUrl = Cypress.env('baseUrl')
    cy.wrap(baseUrl).as('baseUrl')
    cy.wrap(Cypress.env('login')).as('login')

    cy.visit(baseUrl)
    cy.restoreDb()
  })

  beforeEach(function () {
    cy.visit(this.baseUrl)
    cy.wait(1000)
    cy.getAccess(this.login).as('access')
    cy.getAddress(this.login).as('login')
  })

  it('login Account and logout Account', function () {
    cy.contains(this.access.name).should('be.visible')
    cy.contains(this.access.name).click()
    cy.interceptAll(this.access.name)

    cy.get('input[placeholder="Password"]').type(this.access.password)
    cy.contains('button', 'Log In').click()

    cy.get('button[class="btn logout alternate"]')
      .should('be.visible')
      .then(() => {
        const savedAccount = JSON.parse(localStorage.getItem('unlockedAccount'))
        expect(savedAccount.name).be.eq(this.access.name)
        expect(savedAccount.addresses).be.not.eq(undefined)
      })

    cy.get('button[class="btn logout alternate"]').click()
    cy.contains(this.access.name)
      .should('be.visible')
      .then(() => {
        expect(localStorage.getItem('unlockedAccount')).be.eq(null)
      })
  })
})
