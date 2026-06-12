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
  '**/order/pair/tmltk1nzscrdpvy5ng3ywesda9gevvu4s3asryx4ts9t7d4mkxr4c9x9wsgwyr3m_TML'
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

  await page.route('**/transaction', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(POST_TRANSACTION_RESPONSE),
      })
    } else {
      route.continue()
    }
  })

  await page.waitForTimeout(3000)
  await page.getByText('Mintlayer (Testnet)').click()

  await page.click('button.button-transaction-swap')
  await expect(page.getByText('Swap From')).toBeVisible()
  await expect(page.getByText('Swap Assets')).toBeVisible()
  await expect(page.getByTestId('select-token-swap')).toHaveCount(2)
  await expect(page.locator('input#swap-amount-input')).toBeVisible()
  await expect(page.locator('input#swap-amount-input')).toHaveValue('')
  await expect(page.locator('input#swap-amount-input')).toHaveAttribute(
    'placeholder',
    '0',
  )

  await expect(page.getByText('Swap To')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Find orders' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Find orders' })).toBeDisabled()
  await expect(page.getByText('No orders found')).toBeVisible()

  await page.getByTestId('select-token-swap').first().click()
  await expect(page.getByTestId('swap-popup-content')).toBeVisible()
  await expect(page.getByTestId('swap-popup-title')).toHaveText('Swap from')
  await expect(
    page.locator('input[placeholder="Search by symbol or token id"]'),
  ).toBeVisible()
  await expect(
    page.locator('input[placeholder="Search by symbol or token id"]'),
  ).toHaveValue('')

  const fromTokenItems = page.getByTestId('swap-token-list').locator('li')
  await expect(fromTokenItems).toHaveCount(3)
  await expect(fromTokenItems).toHaveText([
    'ML Coins',
    'LLAZY (tmltk1006rkw...5npxyqpfwpy3)',
    'SSwissDogs (tmltk1nzscrd...c9x9wsgwyr3m)',
  ])

  await page.getByText('SwissDogs (tmltk1nzscrd...c9x9wsgwyr3m)').click()
  await expect(page.getByTestId('select-token-swap').first()).toContainText(
    'SwissDogs',
  )
  await expect(page.getByText('Balance: 13')).toBeVisible()

  await page.getByTestId('select-token-swap').last().click()
  await expect(page.getByTestId('swap-popup-content')).toBeVisible()
  await expect(page.getByTestId('swap-popup-title')).toHaveText('Swap to')
  await expect(
    page.locator('input[placeholder="Search by symbol or token id"]'),
  ).toBeVisible()
  await expect(
    page.locator('input[placeholder="Search by symbol or token id"]'),
  ).toHaveValue('')
  const toTokenItems = page.getByTestId('swap-token-list').locator('li')
  const toItemCount = await toTokenItems.count()
  expect(toItemCount).toBeGreaterThan(2)

  await expect(page.getByText('ML Coins')).toBeVisible()
  await page.getByText('ML Coins').click()
  await expect(page.getByTestId('select-token-swap').last()).toContainText(
    'ML (Mintlayer)',
  )

  await page.locator('input#swap-amount-input').fill('1')
  await expect(page.locator('input#swap-amount-input')).toHaveValue('1')
  await expect(
    page.getByRole('button', { name: 'Find orders' }),
  ).not.toBeDisabled()
  await page.getByRole('button', { name: 'Find orders' }).click()
  await expect(page.getByText('No orders found')).toBeHidden()
  await expect(page.getByTestId('order-list')).toBeVisible()

  const orders = page.getByTestId('order')
  await expect(orders).toHaveCount(1)
  await expect(page.getByText('tordr1ckcck8...t7gftq57gs7m')).toBeVisible()
  await expect(page.getByText('88.78788')).toBeVisible()
  await expect(page.getByText('SwissDogs').first()).toBeVisible()
  await expect(page.getByText('177.57576')).toBeVisible()
  await expect(page.getByText('TML').first()).toBeVisible()

  await orders.first().click()
  await expect(page.getByTestId('order-details')).toBeVisible()
  await expect(page.getByTestId('order-details-item-title')).toHaveText(
    'Order id:',
  )
  await expect(
    page.getByTestId('order-details-item-content').first(),
  ).toContainText('tordr1ckcck85mwhc2')
  await expect(page.getByTestId('copy-btn')).toBeVisible()
  await expect(page.getByText('88.78788').first()).toBeVisible()
  await expect(
    page
      .getByTestId('order-details')
      .getByText(
        '(tmltk1nzscrdpvy5ng3ywesda9gevvu4s3asryx4ts9t7d4mkxr4c9x9wsgwyr3m)',
      ),
  ).toBeVisible()
  await expect(page.getByText('177.57576').first()).toBeVisible()
  await expect(
    page.getByTestId('order-details').getByText('(Mintlayer Coin)'),
  ).toBeVisible()

  await expect(page.getByText('Exchage rate:')).toBeVisible()
  await expect(page.getByText(/1 SwissDogs ≈.*TML/)).toBeVisible()
  await expect(
    page.locator('input[placeholder="SwissDogs amount"]'),
  ).toBeVisible()
  await expect(
    page.locator('input[placeholder="SwissDogs amount"]'),
  ).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Swap' })).toBeVisible()

  await page.locator('input[placeholder="SwissDogs amount"]').fill('1')

  await page.getByRole('button', { name: 'Swap' }).click()
  await page.waitForTimeout(5000)
  await expect(page.getByTestId('order-details')).toBeHidden()

  await expect(page.getByText('Sign Transaction')).toBeVisible()
  await expect(page.getByText('Transaction Preview')).toBeVisible()
  await expect(page.getByText('Estimated changes:')).toBeVisible()
  await expect(page.getByText('Fill order')).toBeVisible()
  await expect(page.getByText('Order id:')).toBeVisible()
  await expect(
    page.getByText(
      'tordr1ckcck85mwhc2yz3qahdse7tpyywt49gv9flekyaghkhd59t7gftq57gs7m',
    ),
  ).toBeVisible()
  await expect(page.getByText('Network fee:')).toBeVisible()

  await expect(page.getByRole('button', { name: 'Decline' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Approve and return to page' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Approve and return to page' }).click()

  await expect(page.getByText('Re-enter your Password')).toBeVisible()
  await expect(
    page.locator('input[placeholder="Enter your password"]'),
  ).toBeVisible()
  await expect(
    page.locator('input[placeholder="Enter your password"]'),
  ).toHaveValue('')
  await page
    .locator('input[placeholder="Enter your password"]')
    .fill(senderData.WALLET_PASSWORD)

  await page.getByRole('button', { name: 'Submit' }).click()
  await page.waitForTimeout(2000)
  await expect(page.getByText('Your transaction was sent')).toBeVisible()
  await expect(
    page.getByText(
      '8317215e06e4f36e63901789ede0825467745ee01010a1f8caeb938f9a478432',
    ),
  ).toBeVisible()
})
