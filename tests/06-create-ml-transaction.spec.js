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
  await page.waitForTimeout(10000)
  await page.click(
    'li.crypto-item[data-testid="crypto-item"] h5:text("Mintlayer (Testnet)")',
  )

  await page.click('button.button-transaction-up')
  await expect(page.locator(':text("Send to:")')).toBeVisible()

  await page.fill(
    'input[placeholder="tmt1..."]',
    receiverData.ML_RECEIVING_ADDRESS,
  )
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
