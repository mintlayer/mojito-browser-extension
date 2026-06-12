import { expect, test, beforeEach } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'
import { senderData } from './data/index.js'
import { formatAddress } from './helpers/helpers.js'

let page

beforeEach(async ({ page: newPage }) => {
  test.setTimeout(300000)
  page = newPage
  await useRestoreWallet(page, 'sender')
  await useSetTestnet(page)
})

const formatedPoolId = formatAddress(senderData.POOL_ID)

test('Create ML delegation', async () => {
  // Mock transaction broadcast
  await page.route('**/transaction', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tx_id:
            'ba6a6be12a1226f0038365ff2554dfb9f5aa2cb468a523ee4142fd1f1f6d3254',
        }),
      })
    } else {
      await route.continue()
    }
  })

  await page.getByText('Mintlayer (Testnet)').click()
  await page.click('button.button-transaction-staking')

  await expect(page.getByText(formatedPoolId).first()).toBeVisible({
    timeout: 30000,
  })

  await page.getByRole('button', { name: 'Create new delegation' }).click()

  await expect(page.getByText('Pool id')).toBeVisible()

  await page.fill('input[placeholder="tpool1..."]', senderData.POOL_ID)

  // Wait for fee calculation and Create button to become enabled
  await expect(page.getByRole('button', { name: 'Create' })).toBeEnabled({
    timeout: 60000,
  })
  await page.getByRole('button', { name: 'Create' }).click()

  // Sign transaction page
  await expect(page.getByText('Sign Transaction')).toBeVisible({
    timeout: 30000,
  })
  await expect(page.getByText('Pool Id:')).toBeVisible()
  await expect(page.getByText(senderData.POOL_ID)).toBeVisible()

  await page.getByRole('button', { name: 'Approve and return to page' }).click()

  // Password modal
  await expect(page.getByText('Re-enter your Password')).toBeVisible()
  await page.fill(
    'input[placeholder="Enter your password"]',
    senderData.WALLET_PASSWORD,
  )
  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByText('Your transaction was sent.')).toBeVisible({
    timeout: 30000,
  })
})
