// @ts-check
const { test, expect } = require('@playwright/test')
import { WALLET_NAME, WALLET_PASSWORD, MNEMONIC } from './data/crate-restore.js'

const restoreAccountTest = async ({ page }) => {
  await page.goto('http://127.0.0.1:3000')

  await expect(page.locator('h1')).toHaveText('Mojito')
  await expect(page.locator('h2')).toHaveText(
    'Your Mintlayer, right in your browser.',
  )

  await page.getByRole('button', { name: 'Restore' }).click()

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
  await page.getByRole('button', { name: 'Create' }).click()

  await expect(
    page.locator(
      ':text("In order to restore the wallet, please enter your 12 or 24 Seed Phrase.")',
    ),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Enter Seed Phrases' }).click()

  await page.waitForTimeout(1000)

  const textarea = await page.$$('textarea')
  expect(textarea.length).toBe(1)

  const mnemonicString = MNEMONIC.join(' ')
  await textarea[0].fill(mnemonicString)

  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('button', { name: 'Bitcoin (BTC)' }).click()
  await page.getByRole('button', { name: 'Mintlayer (ML)' }).click()

  await page.getByRole('button', { name: 'Confirm' }).click()

  await page.getByRole('button', { name: 'Segwit' }).click()

  await page.getByRole('button', { name: 'Confirm' }).click()

  await page.waitForSelector(`:text("${WALLET_NAME}")`)
  await expect(page.locator(`:text("${WALLET_NAME}")`)).toBeVisible()

  await page.waitForSelector(':text("Mintlayer (ML)")')
  await expect(page.locator(':text("Bitcoin (BTC)")')).toBeVisible()
  await expect(page.locator(':text("Mintlayer (ML)")')).toBeVisible()
}

test('Restore account', restoreAccountTest)

export const login = async (page) => {
  await restoreAccountTest({ page })
}
