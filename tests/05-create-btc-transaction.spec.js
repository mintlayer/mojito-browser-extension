import { expect, test, beforeEach } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'
import { receiverData } from './data/index.js'
import { formatAddress } from './helpers/helpers.js'

let page

beforeEach(async ({ page: newPage }) => {
  test.setTimeout(10000)
  page = newPage
  await useRestoreWallet(page, 'sender')
  await useSetTestnet(page)
})

const formatedReceiverAddress = formatAddress(
  receiverData.BTC_RECEIVING_ADDRESS,
)

test('Create BTC transaction', async () => {
  await page.waitForTimeout(2000)
  await page.click(
    'li.crypto-item[data-testid="crypto-item"] h5:text("Bitcoin (Testnet)")',
  )
  await page.click('button.btn.update-button')
  await page.waitForTimeout(10000)
  await page.click('button.button-transaction-up')
  await expect(page.locator(':text("Send to:")')).toBeVisible()

  await page.fill(
    'input[placeholder="tb1... or 1... or 3..."]',
    receiverData.BTC_RECEIVING_ADDRESS,
  )
  await page.fill('input[placeholder="0"]', '0.00000001')

  await page.getByRole('button', { name: 'high' }).click()
  await page.getByRole('button', { name: 'Send' }).click()

  await page.waitForTimeout(2000)

  await expect(page.getByTestId('popup').getByText('Send to:')).toBeVisible()
  await expect(
    page
      .getByTestId('popup')
      .getByText(`${receiverData.BTC_RECEIVING_ADDRESS}`),
  ).toBeVisible()

  await expect(
    page.getByTestId('popup').getByText('1e-8BTC(0,00USD)'),
  ).toBeVisible()
  await expect(page.getByTestId('popup').getByText('Total fee:')).toBeVisible()

  await page.getByRole('button', { name: 'Confirm' }).click()

  await expect(
    page.getByTestId('popup').getByText('Enter your password'),
  ).toBeVisible()
  await page.fill('input[placeholder="Password"]', receiverData.WALLET_PASSWORD)

  await page.getByRole('button', { name: 'Send Transaction' }).click()
  await page.route('*/**/tx', async (route) => {
    const json =
      'a6a3d270fa33eb7fca6f6d2f56c0c3c431f9cad51b2a7881208b5e8f4ec12dcf'
    await route.fulfill({ json })
  })

  await page.waitForSelector(':text("Your transaction was sent.")')

  const resultTitleText = await page.textContent('h3.result-title')
  const txid = resultTitleText.split(': ')[1]
})
