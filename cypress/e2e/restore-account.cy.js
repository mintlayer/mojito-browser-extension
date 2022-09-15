describe('Restore account page', () => {
  before(function () {
    cy.deleteDatabase()

    cy.wrap(Cypress.env('baseUrl')).as('baseUrl')
    const login = Cypress.env('login')
    cy.getAccount(login).as('login')
    cy.getAccess(login).then((access) => {
      cy.interceptAll(access.name)
      return cy.wrap(access).as('access')
    })
  })

  beforeEach(function () {
    cy.visit(this.baseUrl)
  })

  it('click on Restore for NewOne', function () {
    cy.contains('button', 'Restore').click()

    cy.setAccount(this.access.name)
    cy.get('input[placeholder="Password"]').type(this.access.password)
    cy.contains('button', 'Create').click()

    cy.contains('button', 'I have them').click()
    cy.writeWords('input', this.login.account)
    cy.contains('button', 'Confirm').click()

    cy.wait('@utxo')
  })
})
