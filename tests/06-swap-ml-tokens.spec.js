import { expect, test, beforeEach } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'
import { senderData } from './data/index.js'

let page

beforeEach(async ({ page: newPage }) => {
  test.setTimeout(300000)
  page = newPage
  await useRestoreWallet(page, 'sender')
  await useSetTestnet(page)
})

const SEARCH_REQUEST_URL =
  'https://api-server-lovelace.mintlayer.org/api/v2/order/pair/tmltk1nzscrdpvy5ng3ywesda9gevvu4s3asryx4ts9t7d4mkxr4c9x9wsgwyr3m_TML'
const SEARCH_REQUEST_RESPONSE = [
  {
    ask_balance: {
      atoms: '1900000000000',
      decimal: '19',
    },
    ask_currency: {
      type: 'Coin',
    },
    conclude_destination: 'tmt1q8apcsvnm648wnvhhz36cehu6lmrqkcwr5qqmju9',
    give_balance: {
      atoms: '3800000000000',
      decimal: '38',
    },
    give_currency: {
      token_id:
        'tmltk1nzscrdpvy5ng3ywesda9gevvu4s3asryx4ts9t7d4mkxr4c9x9wsgwyr3m',
      type: 'Token',
    },
    initially_asked: {
      atoms: '5000000000000',
      decimal: '50',
    },
    initially_given: {
      atoms: '10000000000000',
      decimal: '100',
    },
    nonce: 5,
    order_id:
      'tordr1q3v0xjc2x0qexcwp953qyju223h3ej4hnmza7vxnzm6zz27djlmq69m7mf',
  },
  {
    ask_balance: {
      atoms: '8878788000000',
      decimal: '88.78788',
    },
    ask_currency: {
      token_id:
        'tmltk1nzscrdpvy5ng3ywesda9gevvu4s3asryx4ts9t7d4mkxr4c9x9wsgwyr3m',
      type: 'Token',
    },
    conclude_destination: 'tmt1q8apcsvnm648wnvhhz36cehu6lmrqkcwr5qqmju9',
    give_balance: {
      atoms: '17757576000000',
      decimal: '177.57576',
    },
    give_currency: {
      type: 'Coin',
    },
    initially_asked: {
      atoms: '10000000000000',
      decimal: '100',
    },
    initially_given: {
      atoms: '20000000000000',
      decimal: '200',
    },
    nonce: 4,
    order_id:
      'tordr1ckcck85mwhc2yz3qahdse7tpyywt49gv9flekyaghkhd59t7gftq57gs7m',
  },
  {
    ask_balance: {
      atoms: '9900000000000',
      decimal: '99',
    },
    ask_currency: {
      type: 'Coin',
    },
    conclude_destination: 'tmt1q8apcsvnm648wnvhhz36cehu6lmrqkcwr5qqmju9',
    give_balance: {
      atoms: '9900000000000',
      decimal: '99',
    },
    give_currency: {
      token_id:
        'tmltk1nzscrdpvy5ng3ywesda9gevvu4s3asryx4ts9t7d4mkxr4c9x9wsgwyr3m',
      type: 'Token',
    },
    initially_asked: {
      atoms: '10000000000000',
      decimal: '100',
    },
    initially_given: {
      atoms: '10000000000000',
      decimal: '100',
    },
    nonce: 1,
    order_id:
      'tordr1jujter3n8fd6wpfenvxgn33kq38nklrf5dpg8xyle4hegulwaeesnc7hla',
  },
]

const POST_TRANSACTION_RESPONSE = {
  success: true,
  tx_id: '8317215e06e4f36e63901789ede0825467745ee01010a1f8caeb938f9a478432',
  status: 'accepted',
  timestamp: 1753314844,
}

test('Swap ML tokens', async () => {
  await page.route(SEARCH_REQUEST_URL, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEARCH_REQUEST_RESPONSE),
      })
    } else {
      route.continue()
    }
  })

  await page.route(
    'https://api-server-lovelace.mintlayer.org/api/v2/transaction',
    async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(POST_TRANSACTION_RESPONSE),
        })
      } else {
        route.continue()
      }
    },
  )

  await page.waitForTimeout(3000)
  await page.click(
    'li.crypto-item[data-testid="crypto-item"] h5:text("Mintlayer (Testnet)")',
  )

  await page.click('button.button-transaction-swap')
  await expect(page.locator(':text("Swap From")')).toBeVisible()
  await expect(page.locator(':text("Swap Assets")')).toBeVisible()
  await expect(page.locator('.swap-token-select')).toHaveCount(2)
  await expect(page.locator('input.swap-amount-input')).toBeVisible()
  await expect(page.locator('input.swap-amount-input')).toHaveValue('')
  await expect(page.locator('input.swap-amount-input')).toHaveAttribute(
    'placeholder',
    '0',
  )

  await expect(page.locator('.swap-arrow-button')).toBeVisible()

  await expect(page.locator(':text("Swap To")')).toBeVisible()
  await expect(page.locator('.find-order-button')).toBeVisible()
  await expect(page.locator('.find-order-button')).toHaveText('Find orders')
  await expect(page.locator('.find-order-button')).toBeDisabled()
  await expect(page.locator('.empty-list')).toBeVisible()
  await expect(page.locator('.empty-list')).toHaveText('No orders found')

  await page.locator('.swap-token-select').first().click()
  await expect(page.locator('.token-popup-swap')).toBeVisible()
  await expect(page.locator('.token-popup-swap h2')).toHaveText('Swap from')
  await expect(page.locator('input.swap-token-search-input')).toBeVisible()
  await expect(page.locator('input.swap-token-search-input')).toHaveValue('')
  await expect(page.locator('input.swap-token-search-input')).toHaveAttribute(
    'placeholder',
    'Search by symbol or token id',
  )
  // suppouse to have 3 items
  await expect(page.locator('.token-popup-swap li')).toHaveCount(3)
  await expect(page.locator('.token-popup-swap li')).toHaveText([
    'ML Coins',
    'LLAZY (tmltk1006rkw...5npxyqpfwpy3)',
    'SSwissDogs (tmltk1nzscrd...c9x9wsgwyr3m)',
  ])

  await expect(
    page.locator('.token-popup-swap li .swap-token-logo'),
  ).toHaveCount(3)
  await page
    .locator(
      '.token-popup-swap li:has-text("SwissDogs (tmltk1nzscrd...c9x9wsgwyr3m)")',
    )
    .click()
  await expect(page.locator('.swap-token-select').first()).toHaveText(
    'SSwissDogs (tmltk1nz...wsgwyr3m)',
  )
  await expect(page.locator('.from-token-balance')).toHaveText('Balance: 13')

  await page.locator('.swap-token-select').last().click()
  await expect(page.locator('.token-popup-swap')).toBeVisible()
  await expect(page.locator('.token-popup-swap h2')).toHaveText('Swap to')
  await expect(page.locator('input.swap-token-search-input')).toBeVisible()
  await expect(page.locator('input.swap-token-search-input')).toHaveValue('')
  await expect(page.locator('input.swap-token-search-input')).toHaveAttribute(
    'placeholder',
    'Search by symbol or token id',
  )
  const itemCount = await page.locator('.token-popup-swap li').count()
  expect(itemCount).toBeGreaterThan(2)

  await expect(
    page.locator('.token-popup-swap li:has-text("ML Coins")'),
  ).toBeVisible()
  const itemLogoCount = await page
    .locator('.token-popup-swap li .swap-token-logo')
    .count()
  expect(itemLogoCount).toBeGreaterThan(2)
  await page.locator('.token-popup-swap li:has-text("ML Coins")').click()
  await expect(page.locator('.swap-token-select').last()).toHaveText(
    'ML (Mintlayer)',
  )

  await page.locator('input.swap-amount-input').fill('1')
  await expect(page.locator('input.swap-amount-input')).toHaveValue('1')
  await expect(page.locator('.find-order-button')).not.toBeDisabled()
  await page.click('.find-order-button')
  await expect(page.locator('.empty-list')).toBeHidden()
  await expect(page.locator('.order-list')).toBeVisible()

  expect(page.locator('.order-list li.transaction')).toHaveCount(1)
  await expect(page.getByText('tordr1ckcck8...t7gftq57gs7m')).toBeVisible()
  await expect(
    page.locator('.order-list li.transaction').getByText('88.78788'),
  ).toBeVisible()
  await expect(
    page.locator('.order-list li.transaction').getByText('SwissDogs'),
  ).toBeVisible()
  await expect(
    page.locator('.order-list li.transaction').getByText('177.57576'),
  ).toBeVisible()
  await expect(
    page.locator('.order-list li.transaction').getByText('88.78788'),
  ).toBeVisible()
  await expect(
    page.locator('.order-list li.transaction').getByText('TML'),
  ).toBeVisible()

  await page.click('.order-list li.transaction')
  await expect(page.locator('.order-details')).toBeVisible()
  await expect(
    page.locator('[data-testid="order-details-item-title"]'),
  ).toHaveText('Order id:')
  await expect(
    page.locator('[data-testid="order-details-item-content"]').first(),
  ).toHaveText('tordr1ckcck85mwhc2...hkhd59t7gftq57gs7m')
  await expect(page.locator('.order-details .copy-btn')).toBeVisible()
  await expect(
    page.locator('.token-info-content-amount').getByText('88.78788 SwissDogs'),
  ).toBeVisible()
  await expect(
    page
      .locator('.order-details')
      .getByText(
        '(tmltk1nzscrdpvy5ng3ywesda9gevvu4s3asryx4ts9t7d4mkxr4c9x9wsgwyr3m)',
      ),
  ).toBeVisible()
  await expect(
    page.locator('.token-info-content-amount').getByText('177.57576 ML'),
  ).toBeVisible()
  await expect(
    page.locator('.order-details').getByText('(Mintlayer Coin)'),
  ).toBeVisible()

  await expect(page.locator('.order-details-exchange-rate')).toBeVisible()
  await expect(
    page.locator('span:has-text("1 SwissDogs ≈ 2.0000000000 TML")'),
  ).toBeVisible()
  await expect(page.locator('.order-details-input')).toBeVisible()
  await expect(page.locator('.order-details-input')).toHaveAttribute(
    'placeholder',
    'SwissDogs amount',
  )
  await expect(page.locator('.order-details-input')).toHaveValue('')
  await expect(page.locator('.order-details-button')).toBeVisible()
  await expect(page.locator('.order-details-button')).toHaveText('Swap')

  await page.locator('.order-details-input').fill('1')
  await expect(page.locator('.order-details-input')).toHaveValue('1')

  await page.click('.order-details-button')
  await page.waitForTimeout(5000)
  await expect(page.locator('.order-details')).toBeHidden()

  await expect(page.locator('.SignTransaction')).toBeVisible()
  await expect(page.locator('.signTxTitle')).toHaveText('Sign Transaction')
  await expect(page.locator('.preview-section-header h3')).toHaveText(
    'Transaction Preview',
  )
  await expect(
    page.locator('.SignTransaction').getByText('Estimated changes:'),
  ).toBeVisible()
  await expect(
    page.locator('.SignTransaction').getByText('Fill order'),
  ).toBeVisible()
  await expect(
    page.locator('.SignTransaction').getByText('Order id:'),
  ).toBeVisible()
  await expect(
    page
      .locator('.SignTransaction')
      .getByText(
        'tordr1ckcck85mwhc2yz3qahdse7tpyywt49gv9flekyaghkhd59t7gftq57gs7m',
      ),
  ).toBeVisible()
  await expect(
    page.locator('.SignTransaction').getByText('Network fee:'),
  ).toBeVisible()

  await expect(page.locator('.SignTransaction .footer')).toBeVisible()
  await expect(
    page.locator('.SignTransaction .footer').getByText('Decline'),
  ).toBeVisible()
  await expect(
    page
      .locator('.SignTransaction .footer')
      .getByText('Approve and return to page'),
  ).toBeVisible()
  await page.click(
    '.SignTransaction .footer button:has-text("Approve and return to page")',
  )
  await expect(page.locator('.modal-content')).toBeVisible()
  await expect(
    page.locator('.modal-content').getByText('Re-enter your Password'),
  ).toBeVisible()
  await expect(
    page.locator('.modal-content [data-testid="input"][type="password"]'),
  ).toBeVisible()
  await expect(
    page.locator('.modal-content [data-testid="input"][type="password"]'),
  ).toHaveValue('')
  await page
    .locator('.modal-content [data-testid="input"][type="password"]')
    .fill(senderData.WALLET_PASSWORD)
  await expect(
    page.locator('.modal-content [data-testid="input"][type="password"]'),
  ).toHaveValue(senderData.WALLET_PASSWORD)
  await page.click('.modal-buttons button:has-text("Submit")')
  await page.waitForTimeout(2000)
  await expect(
    page.locator('h2').getByText('Your transaction was sent'),
  ).toBeVisible()
  await expect(
    page.getByText(
      '8317215e06e4f36e63901789ede0825467745ee01010a1f8caeb938f9a478432',
    ),
  ).toBeVisible()
})
