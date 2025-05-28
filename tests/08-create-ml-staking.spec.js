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

  await page.fill('input[placeholder="0"]', '0.00000001')

  await page.getByRole('button', { name: 'Send' }).click()

  await expect(page.getByTestId('popup').getByText('Send to:')).toBeVisible()
  await expect(
    page.getByTestId('popup').getByText(`${inputValue}`),
  ).toBeVisible()

  await expect(
    page.getByTestId('popup').getByText('1e-8ML(0,00USD)'),
  ).toBeVisible()
  await expect(page.getByTestId('popup').getByText('Total fee:')).toBeVisible()

  await page.getByRole('button', { name: 'Confirm' }).click()
  await expect(
    page.getByTestId('popup').getByText('Enter your password'),
  ).toBeVisible()
  await page.fill('input[placeholder="Password"]', receiverData.WALLET_PASSWORD)

  await page.getByRole('button', { name: 'Send Transaction' }).click()

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
