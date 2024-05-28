import { expect, test, beforeEach } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'

let page

beforeEach(async ({ page: newPage }) => {
  test.setTimeout(190000)
  page = newPage
  await useRestoreWallet(page, 'sender')
  await useSetTestnet(page)
})

test('Delegation details', async () => {
  test.setTimeout(190000)
  await page.click(
    'li.crypto-item[data-testid="crypto-item"] h5:text("Mintlayer (Testnet)")',
  )
  await page.waitForTimeout(5000)
  await page.click('button.button-transaction-staking')

  await page.waitForSelector('li.transaction')
  await page.click('li.transaction:first-of-type')

  await expect(page.getByTestId('popup').getByText('Date:')).toBeVisible()
  await expect(page.getByTestId('popup').getByText('Pool id:')).toBeVisible()
  await expect(page.getByTestId('popup').getByText('Amount:')).toBeVisible()
  await expect(
    page.getByTestId('popup').getByText('Spend address:'),
  ).toBeVisible()

  const elements = await page.$$eval(
    '.transactionDetItemContent > :first-child',
    (elements) => elements.map((el) => el.innerText),
  )
  elements.forEach((element) => {
    expect(element).not.toBe('')
  })

  await expect(page.getByTestId('popup').getByText('Add Funds')).toBeVisible()
  await expect(page.getByTestId('popup').getByText('Withdraw')).toBeVisible()
  await expect(
    page.getByTestId('popup').getByText('Open In Block Explorer'),
  ).toBeVisible()
})
