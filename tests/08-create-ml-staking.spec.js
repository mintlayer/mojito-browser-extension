import { expect, test, beforeEach } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'
import { receiverData, senderData } from './data/index.js'
import { formatAddress } from './helpers/helpers.js'
import { time } from 'console'

let page

beforeEach(async ({ page: newPage }) => {
  test.setTimeout(190000)
  page = newPage
  await useRestoreWallet(page, 'sender')
  await useSetTestnet(page)
})

test('Create ML staking', async () => {
  await page.click(
    'li.crypto-item[data-testid="crypto-item"] h5:text("Mintlayer (Testnet)")',
  )

  await page.click('button.button-transaction-staking')
  await page.waitForTimeout(5000)

  await page.getByRole('button', { name: 'Add funds' }).nth(0).click()
  await expect(page.locator(':text("Deleg id:")')).toBeVisible()

  const inputValue = await page
    .locator('input.input.address-field')
    .inputValue()
  expect(inputValue).not.toBe('')

  await page.fill('input[placeholder="0"]', '1.1')

  await page.getByRole('button', { name: 'Send' }).click()

  await expect(page.getByText('Sign Transaction')).toBeVisible()

  await expect(
    page.getByRole('button', { name: 'Switch to json' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Decline' })).toBeVisible()
  await page.getByRole('button', { name: 'Approve and return to page' }).click()

  await expect(page.getByText('Re-enter your Password')).toBeVisible()
  await page.fill(
    'input[placeholder="Enter your password"]',
    receiverData.WALLET_PASSWORD,
  )

  await page.getByRole('button', { name: 'Submit' }).click()
  await page.route(
    'https://api-server-lovelace.mintlayer.org/api/v2/transaction',
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tx_id:
            'ba6a6be12a1226f0038365ff2554dfb9f5aa2cb468a523ee4142fd1f1f6d3254',
        }),
      }),
  )

  await page.waitForSelector(':text("Your transaction was sent.")')
})
