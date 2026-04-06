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

  await page.getByRole('button', { name: 'Create Wallet' }).click()

  await page.waitForSelector(`:text("${WALLET_NAME}")`)
  await expect(page.locator(`:text("${WALLET_NAME}")`)).toBeVisible()

  await page.waitForSelector(':text("Mintlayer (ML)")')
  await expect(page.locator(':text("Bitcoin (BTC)")')).toBeVisible()
  await expect(page.locator(':text("Mintlayer (ML)")')).toBeVisible()
})
