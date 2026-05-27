import { test, beforeEach, expect } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { senderData } from './data/index.js'
let page

const deleteDescription =
  'If you delete a wallet, you may lose access to all the funds associated with it. Please make sure that you have securely saved your seed phrase before proceeding.'

beforeEach(async ({ page: newPage }) => {
  test.setTimeout(300000)
  page = newPage
  await useRestoreWallet(page, 'sender')
})

test('Delete account - cancel', async () => {
  await page.getByText('Settings').click()

  await expect(page.getByText('Delete wallet')).toBeVisible()
  await expect(page.getByText(deleteDescription)).toBeVisible()

  await expect(page.locator('button.settings-delete-button')).toBeVisible()
  await page.click('button.settings-delete-button')

  const popup = page.getByTestId('popup')
  await expect(popup.getByText('Delete wallet permanently?')).toBeVisible()
  await expect(
    popup.getByText(
      'All local data associated with this wallet will be permanently lost.',
    ),
  ).toBeVisible()
  await expect(popup.getByText('This action cannot be undone')).toBeVisible()
  await expect(
    popup.getByText(
      'Make sure you have securely saved your seed phrase before proceeding.',
    ),
  ).toBeVisible()

  await expect(popup.getByRole('button', { name: 'Cancel' })).toBeVisible()
  await popup.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByText('Delete wallet')).toBeVisible()
})

test('Delete account from settings', async () => {
  await page.getByText('Settings').click()

  await expect(page.getByText('Delete wallet')).toBeVisible()
  await expect(page.getByText(deleteDescription)).toBeVisible()

  await expect(page.locator('button.settings-delete-button')).toBeVisible()
  await page.click('button.settings-delete-button')

  const popup = page.getByTestId('popup')
  await expect(popup.getByText('Delete wallet permanently?')).toBeVisible()
  await expect(
    popup.getByText(
      'All local data associated with this wallet will be permanently lost.',
    ),
  ).toBeVisible()
  await expect(popup.getByText('This action cannot be undone')).toBeVisible()

  await popup
    .locator('label')
    .filter({ hasText: 'I have saved my seed phrase' })
    .click()
  await popup
    .locator('label')
    .filter({ hasText: 'I understand this action is irreversible' })
    .click()

  await popup.getByRole('button', { name: 'Delete wallet' }).click()

  await expect(popup.getByText(senderData.WALLET_NAME)).toBeVisible()
  await expect(
    popup.getByText('Enter your password to delete this wallet'),
  ).toBeVisible()

  await expect(page.locator('input[type="password"]')).toHaveAttribute(
    'placeholder',
    'Password',
  )

  await page.fill('input[placeholder="Password"]', senderData.WALLET_PASSWORD)
  await page.getByRole('button', { name: 'Delete Wallet' }).click()
  await expect(page.getByTestId('create-restore')).toBeVisible({
    timeout: 30000,
  })
})

test('Delete account from login', async () => {
  await page.getByText('Logout').click()

  await expect(page.getByText('Choose an account')).toBeVisible()
  await expect(page.getByText(senderData.WALLET_NAME)).toBeVisible()

  await page.getByTestId('delete-wallet-button').first().click()

  const popup = page.getByTestId('popup')
  await expect(popup.getByText('Delete wallet permanently?')).toBeVisible()
  await expect(
    popup.getByText(
      'All local data associated with this wallet will be permanently lost.',
    ),
  ).toBeVisible()
  await expect(popup.getByText('This action cannot be undone')).toBeVisible()

  await popup
    .locator('label')
    .filter({ hasText: 'I have saved my seed phrase' })
    .click()
  await popup
    .locator('label')
    .filter({ hasText: 'I understand this action is irreversible' })
    .click()

  await popup.getByRole('button', { name: 'Delete wallet' }).click()

  await expect(popup.getByText(senderData.WALLET_NAME)).toBeVisible()
  await expect(
    popup.getByText('Enter your password to delete this wallet'),
  ).toBeVisible()

  await expect(page.locator('input[type="password"]')).toHaveAttribute(
    'placeholder',
    'Password',
  )

  await page.fill('input[placeholder="Password"]', senderData.WALLET_PASSWORD)
  await page.getByRole('button', { name: 'Delete Wallet' }).click()
  await expect(page.getByTestId('create-restore')).toBeVisible({
    timeout: 30000,
  })
})
