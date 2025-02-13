import { expect, test, beforeEach } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'
import { receiverData } from './data/index.js'
import { formatAddress } from './helpers/helpers.js'

let page

beforeEach(async ({ page: newPage }) => {
  test.setTimeout(300000)
  page = newPage
  await useRestoreWallet(page, 'sender')
  await useSetTestnet(page)
})

const formatedReceiverAddress = formatAddress(receiverData.ML_RECEIVING_ADDRESS)

test('Create ML transaction', async () => {
  await page.waitForTimeout(250000)
  await page.click(
    'li.crypto-item[data-testid="crypto-item"] h5:text("Mintlayer (Testnet)")',
  )

  await page.click('button.button-transaction-up')
  await expect(page.locator(':text("Send to:")')).toBeVisible()

  await page.fill(
    'input[placeholder="tmt1..."]',
    receiverData.ML_RECEIVING_ADDRESS,
  )
  await page.fill('input[placeholder="0"]', '0.00000001')

  await page.getByRole('button', { name: 'Send' }).click()

  await expect(page.getByTestId('popup').getByText('Send to:')).toBeVisible()
  await expect(
    page.getByTestId('popup').getByText(`${receiverData.ML_RECEIVING_ADDRESS}`),
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
    async (route) => {
      if (route.request().method() === 'POST') {
        const json = {
          tx_id:
            '2d2f9f3173eeeda73fd8705d41488ba2337e83fcd808bc732458a3752846ebb5',
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(json),
        })
      } else {
        route.continue()
      }
    },
  )

  await page.waitForSelector(':text("Your transaction was sent.")')

  const resultTitleText = await page.textContent('h3.result-title')
  const txid = resultTitleText.split(': ')[1]
})
