describe('create account page ', () => {
  before(function () {
    cy.deleteDatabase()
    cy.wrap(Cypress.env('baseUrl')).as('baseUrl')
    cy.wrap(Cypress.env('create')).as('create')
  })

  beforeEach(function () {
    cy.visit(this.baseUrl)
    cy.contains('button', 'Create').click()
    cy.getAccess(this.create).then((access) => {
      const { name, password } = access
      cy.setAccountAndPassword(name, password)

      cy.interceptAll(name)
    })
  })

  const getRandomIntBetween = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  const drawRandomEntropy = (element) => {
    cy.get(element).then(($el) => {
      const coords = $el[0].getBoundingClientRect()
      const gap = 20
      const limits = {
        minX: coords.left + gap,
        maxX: coords.right - gap,
        minY: coords.top + gap,
        maxY: coords.bottom - gap,
      }
      for (let i = 0; i < 20; i++) {
        cy.get('.drawingBoardStage')
          .trigger('mousedown', {
            clientX: getRandomIntBetween(limits.minX, limits.maxX),
            clientY: getRandomIntBetween(limits.minY, limits.maxY),
          })
          .trigger('mousemove', {
            clientX: getRandomIntBetween(limits.minX, limits.maxX),
            clientY: getRandomIntBetween(limits.minY, limits.maxY),
          })
          .trigger('mousemove', {
            clientX: getRandomIntBetween(limits.minX, limits.maxX),
            clientY: getRandomIntBetween(limits.minY, limits.maxY),
          })
          .trigger('mousemove', {
            clientX: getRandomIntBetween(limits.minX, limits.maxX),
            clientY: getRandomIntBetween(limits.minY, limits.maxY),
          })
          .trigger('mousemove', {
            clientX: getRandomIntBetween(limits.minX, limits.maxX),
            clientY: getRandomIntBetween(limits.minY, limits.maxY),
          })
          .trigger('mouseup')
      }
    })
  }

  it('create account', function () {
    const drawingBoardStage = '.drawingBoardStage'
    cy.contains('Mojito').should('be.visible')
    cy.contains('li.step.active', 'Entropy Generation').should('be.visible')
    cy.contains(
      'In the blank screen aside please draw anything you want.',
    ).should('be.visible')
    cy.contains(
      'We are going to use this drawing to generate a random seed for your wallet.',
    ).should('be.visible')
    cy.contains(
      'We are going to use this drawing to generate a random seed for your wallet.',
    ).should('be.visible')
    cy.contains(
      'The more random the drawing is, the more secure your wallet will be.',
    ).should('be.visible')
    cy.contains('Express your art.').should('be.visible')
    cy.contains('button', 'Clear').should('be.visible')
    cy.contains('button', 'Continue').should('be.visible')

    drawRandomEntropy(drawingBoardStage)

    cy.contains('button', 'Clear').click()
    cy.contains('button', 'Continue').click()

    cy.contains('Your entropy is too small. Please draw more lines.').should(
      'be.visible',
    )

    drawRandomEntropy(drawingBoardStage)

    cy.wait(2000)

    cy.contains('button', 'Continue').click()
    cy.contains('li.step.active', 'Seed Phrases').should('be.visible')
    cy.contains(
      'Write down each of the words (seed phrases) that are shown on the next screen.',
    ).should('be.visible')
    cy.contains(
      'Store them in a safe place as they are the only way to restore your wallet.',
    ).should('be.visible')
    cy.contains('button', 'I understand').should('be.visible')

    cy.contains('button', 'I understand').click()
    cy.getWords('input.words-list-input.readonly').then((words) => {
      expect(words)
      cy.saveAccount(this.create, { account: words })

      cy.contains('button', 'Backup done!').click()
      cy.writeWords('input.words-list-input', words)
      cy.contains('button', 'Continue').click()
    })

    cy.contains('button', 'Create account').click()
    cy.wait(1000)
    cy.contains('button', 'Create account').should('be.visible')

    cy.contains('button', 'Bitcoin (BTC)').click()
    cy.contains('button', 'Create account').click()

    cy.contains('Just a sec, we are creating your account...').should(
      'be.visible',
    )

    cy.wait(2000)
  })
})
