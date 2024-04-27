import { expect, test, beforeEach } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'
import { senderData } from './data/index.js'

let page

beforeEach(async ({ page: newPage }) => {
  page = newPage
  await useRestoreWallet(page, 'sender')
  await useSetTestnet(page)
})

test('Transaction details', async () => {
  await page.click(
    'li.crypto-item[data-testid="crypto-item"] h5:text("Mintlayer (Test)")',
  )
  await page.waitForTimeout(5000)

  await page.waitForSelector('li.transaction')
  await page.click('li.transaction:first-of-type')

  await expect(page.getByTestId('popup').getByText('To:')).toBeVisible()

  await expect(page.getByTestId('popup').getByText('Date:')).toBeVisible()
  await expect(page.getByTestId('popup').getByText('Amount:')).toBeVisible()
  await expect(page.getByTestId('popup').getByText('Tx:')).toBeVisible()
  await expect(
    page.getByTestId('popup').getByText('Confirmations:'),
  ).toBeVisible()

  const elements = await page.$$eval(
    '.transactionDetItemContent > :first-child',
    (elements) => elements.map((el) => el.innerText),
  )
  elements.forEach((element) => {
    expect(element).not.toBe('')
  })

  await expect(
    page.getByTestId('popup').getByText('Open In Block Explorer'),
  ).toBeVisible()
})
