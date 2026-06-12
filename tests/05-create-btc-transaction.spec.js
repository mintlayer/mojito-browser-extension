import { expect, test, beforeEach } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'
import { receiverData } from './data/index.js'

let page

beforeEach(async ({ page: newPage }) => {
  page = newPage
  await useRestoreWallet(page, 'sender')
  await useSetTestnet(page)
})

test('Create BTC transaction', async () => {
  test.setTimeout(300000)
  await page.waitForTimeout(10000)
  await page.click('button.update-button')
  await page.waitForTimeout(10000)
  await page.getByText('Bitcoin (Testnet)').click()
  await page.click('button.button-transaction-up')
  await expect(page.getByText('Recipient address')).toBeVisible()

  await page.locator('input#address').fill(receiverData.BTC_RECEIVING_ADDRESS)
  await page.fill('input[placeholder="0"]', '0.00000001')

  await page.getByRole('button', { name: 'Fast' }).click()
  await page.waitForTimeout(2000)
  await page.getByRole('button', { name: 'Send' }).click({ timeout: 30000 })

  await expect(page.getByText('Confirm Transaction')).toBeVisible()
  await expect(page.getByText(receiverData.BTC_RECEIVING_ADDRESS)).toBeVisible()
  await expect(page.getByText('Network fee')).toBeVisible()

  await page.getByRole('button', { name: 'Confirm' }).click()

  await expect(page.getByText('Enter your password')).toBeVisible()
  await page.fill(
    'input[placeholder="Enter your password"]',
    receiverData.WALLET_PASSWORD,
  )

  await page.route('*/**/tx', async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        txid: 'a6a3d270fa33eb7fca6f6d2f56c0c3c431f9cad51b2a7881208b5e8f4ec12dcf',
      }),
      contentType: 'application/json',
    })
  })

  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByText('Your transaction was sent.')).toBeVisible({
    timeout: 30000,
  })
})
