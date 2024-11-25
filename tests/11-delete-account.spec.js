import { test, beforeEach, expect } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { senderData } from './data/index.js'
let page

const deleteDescription =
  'If you delete a wallet, you may lose access to all the funds associated with it. Please make sure that you have securely saved your seed phrase before proceeding.'

beforeEach(async ({ page: newPage }) => {
  test.setTimeout(190000)
  page = newPage
  await useRestoreWallet(page, 'sender')
})

// Delete account - cancel
test('Delete account - cancel', async () => {
  test.setTimeout(190000)
  await page.click('button.header-menu-button')
  const settings = page.getByText('Settings', { selector: 'li' })
  await settings.click()

  await expect(page.locator(':text("DELETE WALLET")')).toBeVisible()
  await expect(page.locator(`:text("${deleteDescription}")`)).toBeVisible()

  const isDeleteButtonVisible = await page
    .locator('button.settings-delete-button')
    .isVisible()
  expect(isDeleteButtonVisible).toBe(true)

  await page.click('button.settings-delete-button')

  await expect(
    page
      .getByTestId('popup')
      .getByText('Are you sure you want to permanently delete your wallet?'),
  ).toBeVisible()
  await expect(
    page
      .getByTestId('popup')
      .getByText(
        'All local data associated with this wallet will be permanently lost.',
      ),
  ).toBeVisible()
  await expect(
    page.getByTestId('popup').getByText('This action cannot be undone.'),
  ).toBeVisible()
  await expect(
    page
      .getByTestId('popup')
      .getByText(
        'Please make sure that you have securely saved your seed phrase before proceeding.',
      ),
  ).toBeVisible()
  await expect(
    page
      .getByTestId('popup')
      .getByText('Please confirm that you wish to proceed.'),
  ).toBeVisible()

  await expect(page.getByTestId('popup').getByText('Cancel')).toBeVisible()

  await expect(page.getByTestId('popup').getByText('Continue')).toBeVisible()

  await page.getByRole('button', { name: 'Cancel' }).click()

  await expect(page.locator(':text("DELETE WALLET")')).toBeVisible()
})

// Delete account from settings
test('Delete account from settings', async () => {
  test.setTimeout(190000)
  await page.click('button.header-menu-button')
  const settings = page.getByText('Settings', { selector: 'li' })
  await settings.click()

  await expect(page.locator(':text("DELETE WALLET")')).toBeVisible()
  await expect(page.locator(`:text("${deleteDescription}")`)).toBeVisible()

  const isDeleteButtonVisible = await page
    .locator('button.settings-delete-button')
    .isVisible()
  expect(isDeleteButtonVisible).toBe(true)

  await page.click('button.settings-delete-button')

  await expect(
    page
      .getByTestId('popup')
      .getByText('Are you sure you want to permanently delete your wallet?'),
  ).toBeVisible()
  await expect(
    page
      .getByTestId('popup')
      .getByText(
        'All local data associated with this wallet will be permanently lost.',
      ),
  ).toBeVisible()
  await expect(
    page.getByTestId('popup').getByText('This action cannot be undone.'),
  ).toBeVisible()
  await expect(
    page
      .getByTestId('popup')
      .getByText(
        'Please make sure that you have securely saved your seed phrase before proceeding.',
      ),
  ).toBeVisible()
  await expect(
    page
      .getByTestId('popup')
      .getByText('Please confirm that you wish to proceed.'),
  ).toBeVisible()

  await expect(page.getByTestId('popup').getByText('Cancel')).toBeVisible()

  await expect(page.getByTestId('popup').getByText('Continue')).toBeVisible()

  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(
    page.getByTestId('popup').getByText('Password for'),
  ).toBeVisible()
  await expect(
    page.getByTestId('popup').getByText(senderData.WALLET_NAME),
  ).toBeVisible()

  await expect(page.locator('input[type="password"]')).toHaveAttribute(
    'placeholder',
    'Password',
  )
  await page.fill('input[placeholder="Password"]', senderData.WALLET_PASSWORD)

  await page.getByRole('button', { name: 'Delete Wallet' }).click()

  await page.waitForSelector(':text("Your Mintlayer, right in your browser.")')
})

// Delete account from login page
test('Delete account from login', async () => {
  test.setTimeout(190000)
  await page.click('button.header-menu-button')
  const logoutElement = page.getByText('Logout', { selector: 'li' })
  await logoutElement.click()

  await expect(page.locator(':text("Available wallet")')).toBeVisible()
  await expect(page.locator(`:text("${senderData.WALLET_NAME}")`)).toBeVisible()
  await page.locator('button[name="account"]').hover()

  await page.click('button.delete-button')

  await expect(
    page
      .getByTestId('popup')
      .getByText('Are you sure you want to permanently delete your wallet?'),
  ).toBeVisible()
  await expect(
    page
      .getByTestId('popup')
      .getByText(
        'All local data associated with this wallet will be permanently lost.',
      ),
  ).toBeVisible()
  await expect(
    page.getByTestId('popup').getByText('This action cannot be undone.'),
  ).toBeVisible()
  await expect(
    page
      .getByTestId('popup')
      .getByText(
        'Please make sure that you have securely saved your seed phrase before proceeding.',
      ),
  ).toBeVisible()
  await expect(
    page
      .getByTestId('popup')
      .getByText('Please confirm that you wish to proceed.'),
  ).toBeVisible()

  await expect(page.getByTestId('popup').getByText('Cancel')).toBeVisible()

  await expect(page.getByTestId('popup').getByText('Continue')).toBeVisible()

  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(
    page.getByTestId('popup').getByText('Password for'),
  ).toBeVisible()
  await expect(
    page.getByTestId('popup').getByText(senderData.WALLET_NAME),
  ).toBeVisible()

  await expect(page.locator('input[type="password"]')).toHaveAttribute(
    'placeholder',
    'Password',
  )
  await page.fill('input[placeholder="Password"]', senderData.WALLET_PASSWORD)

  await page.getByRole('button', { name: 'Delete Wallet' }).click()

  await page.waitForSelector(':text("Your Mintlayer, right in your browser.")')
})
