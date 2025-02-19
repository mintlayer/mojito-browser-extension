import { expect, test, beforeEach } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'
import { receiverData, senderData } from './data/index.js'
import { formatAddress } from './helpers/helpers.js'

let page

beforeEach(async ({ page: newPage }) => {
  test.setTimeout(190000)
  page = newPage
  await useRestoreWallet(page, 'sender')
  await useSetTestnet(page)
})

const formatedReceiverAddress = formatAddress(receiverData.ML_RECEIVING_ADDRESS)
const formatedPoolId = formatAddress(senderData.POOL_ID)

test('Create ML delegation', async () => {
  await page.click(
    'li.crypto-item[data-testid="crypto-item"] h5:text("Mintlayer (Testnet)")',
  )

  await page.click('button.button-transaction-staking')

  await page.waitForSelector(`:text("${formatedPoolId}")`)
  await expect(page.locator(`:text("${formatedPoolId}")`).nth(0)).toBeVisible()

  await page.getByRole('button', { name: 'Create new delegation' }).click()

  await page.waitForTimeout(1000)
  await expect(page.locator(':text("Pool id:")')).toBeVisible()

  await page.fill('input[placeholder="tpool1..."]', senderData.POOL_ID)
  await page.getByRole('button', { name: 'Create' }).click()

  await page.waitForTimeout(1000)

  await expect(page.getByTestId('popup').getByText('Send to:')).toBeVisible()
  await expect(
    page.getByTestId('popup').getByText(`${senderData.POOL_ID}`),
  ).toBeVisible()

  await expect(
    page.getByTestId('popup').getByText('0.00ML(0,00USD)'),
  ).toBeVisible()
  await expect(page.getByTestId('popup').getByText('Total fee:')).toBeVisible()

  await page.getByRole('button', { name: 'Confirm' }).click()

  await expect(
    page.getByTestId('popup').getByText('Enter your password'),
  ).toBeVisible()
  await page.fill('input[placeholder="Password"]', senderData.WALLET_PASSWORD)

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

  await page.waitForTimeout(2000)

  await page.waitForSelector(':text("Your transaction was sent.")')
})
