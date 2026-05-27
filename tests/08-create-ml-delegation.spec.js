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
  const senderAddress = await page.evaluate(() => {
    const account = JSON.parse(localStorage.getItem('unlockedAccount'))
    return (
      account?.mlReceivingAddresses?.[0] ||
      'tmt1q9zalupfrs8h8p8uy3cu2splf3mggzm28g5tvzrf'
    )
  })

  // Mock SDK's UTXO fetch (api.mintini.app responds but SDK crashes with 1 UTXO
  // when amount=0n — selectUTXOs returns empty, line 1493 accesses inputs[0].input)
  await page.route('https://api.mintini.app/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        utxos: [
          {
            outpoint: {
              source_id:
                'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
              index: 0,
            },
            utxo: {
              type: 'Transfer',
              destination: senderAddress,
              value: {
                type: 'Coin',
                amount: { atoms: '10000000000000' },
              },
            },
          },
          {
            outpoint: {
              source_id:
                'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b200',
              index: 0,
            },
            utxo: {
              type: 'Transfer',
              destination: senderAddress,
              value: {
                type: 'Coin',
                amount: { atoms: '5000000000000' },
              },
            },
          },
        ],
      }),
    })
  })

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
