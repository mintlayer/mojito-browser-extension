describe('mojito wallet app', () => {
  before(() => {
    cy.deleteDatabase()
    cy.wrap(Cypress.env('baseUrl')).as('baseUrl')
  })

  beforeEach(function () {
    cy.visit(this.baseUrl)
  })

  it('displays attribute page', () => {
    cy.title({ log: true }).should(
      'eq',
      'Mojito - A Mintlayer Wallet (staging)',
    )

    cy.contains('Mojito').should('be.visible')
    cy.contains('Your Bitcoin wallet right in your browser').should(
      'be.visible',
    )
    cy.contains('©Mintlayer, 2022').should('be.visible')
    cy.contains('mintlayer.org').should('be.visible')

    cy.contains('button', 'Create').should('be.visible')
    cy.contains('button', 'Restore').should('be.visible')
  })

  it('click on Create and navigate', () => {
    cy.contains('button', 'Create').click()

    cy.contains('Create a name to your account').should('be.visible')
  })

  it('click on Restore and navigate', () => {
    cy.contains('button', 'Restore').click()
    cy.contains('Create a name to your account').should('be.visible')
  })
})
