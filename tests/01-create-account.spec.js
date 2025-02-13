// @ts-nocheck
const { test, expect } = require('@playwright/test')
import { WALLET_NAME, WALLET_PASSWORD } from './data/crate-restore.js'

test('Create account', async ({ page }) => {
  test.setTimeout(190000)
  await page.goto('http://127.0.0.1:8000')

  await expect(page.locator('h1')).toHaveText('Mojito')
  await expect(page.locator('h2')).toHaveText(
    'Your Mintlayer, right in your browser.',
  )

  await page.getByRole('button', { name: 'Create' }).click()

  await expect(page.locator('label')).toHaveText(
    'Create a name for your wallet',
  )
  await expect(page.locator('input')).toHaveAttribute(
    'placeholder',
    'Wallet Name',
  )
  await page.fill('input[placeholder="Wallet Name"]', WALLET_NAME)
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.locator('label')).toHaveText(
    'Create a password for your wallet',
  )
  await expect(page.locator('input')).toHaveAttribute('placeholder', 'Password')
  await page.fill('input[placeholder="Password"]', WALLET_PASSWORD)
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(
    page.locator(
      ':text("In the blank screen aside please draw anything you want.")',
    ),
  ).toBeVisible()

  await expect(
    page.locator(
      ':text("We are going to use this drawing to generate a random seed for your wallet.")',
    ),
  ).toBeVisible()

  await expect(
    page.locator(
      ':text("The more random the drawing is, the more secure your wallet will be.")',
    ),
  ).toBeVisible()

  await expect(page.locator(':text("Express your art.")')).toBeVisible()

  // Helper functions
  const getRandomIntBetween = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  const drawRandomEntropy = async (page, element) => {
    const el = await page.$(element)
    const coords = await el.boundingBox()
    const gap = 50
    const limits = {
      minX: coords.x + gap,
      maxX: coords.x + coords.width - gap,
      minY: coords.y + gap,
      maxY: coords.y + coords.height - gap,
    }
    for (let i = 0; i < 55; i++) {
      const x = getRandomIntBetween(limits.minX, limits.maxX)
      const y = getRandomIntBetween(limits.minY, limits.maxY)
      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.mouse.move(x + 10, y + 10) // move a little bit while the mouse button is down
      await page.mouse.up()
    }
  }

  const drawingBoardStage = 'div.drawingBoard'

  await drawRandomEntropy(page, drawingBoardStage)

  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(
    page.locator(
      ':text("Write down each of the words (seed phrases) that are shown on the next screen.")',
    ),
  ).toBeVisible()
  await expect(
    page.locator(
      ':text("Store them in a safe place as they are the only way to restore your wallet.")',
    ),
  ).toBeVisible()

  await page.getByRole('button', { name: 'I understand' }).click()

  await page.waitForTimeout(1000)

  const backupInputs = await page.$$('input[type="text"]')
  const backupInputsValues = await Promise.all(
    backupInputs.map((input) => input.evaluate((input) => input.value)),
  )

  page.waitForTimeout(1000)

  expect(backupInputs.length).toBe(12)
  expect(backupInputsValues.length).toBe(12)

  await page.getByRole('button', { name: 'Backup done!' }).click()

  const confirmInputs = await page.$$('input[type="text"]')
  for (let i = 0; i < confirmInputs.length; i++) {
    await confirmInputs[i].fill(backupInputsValues[i])
  }

  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('button', { name: 'Create Wallet' }).click()

  await page.waitForSelector(`:text("${WALLET_NAME}")`)
  await expect(page.locator(`:text("${WALLET_NAME}")`)).toBeVisible()

  await page.waitForSelector(':text("Mintlayer (ML)")')
  await expect(page.locator(':text("Bitcoin (BTC)")')).toBeVisible()
  await expect(page.locator(':text("Mintlayer (ML)")')).toBeVisible()
})
