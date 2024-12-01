import { expect, test, beforeEach } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'
import { senderData } from './data/index.js'

const message = 'Hello, World!'
const address = 'tmt1qx2jfhcy0e82thvfdpszwqx440duvctw5vqsrtlk'
const signedMessage =
  'AAO4un6KC1PARAV91xExrrHMo2gKwJeq1hmrU6gQa8PO1QAl7ifSVw1hFKbY97Yc4HKNf/uDvFd8wAPuvQ2GFdqI+kXI201iBNdWET/bIoYqEfHTN/ZvJURjYTgxydhOrE0g'

let page

beforeEach(async ({ page: newPage }) => {
  test.setTimeout(190000)
  page = newPage
  await useRestoreWallet(page, 'sender')
  await useSetTestnet(page)
})

test('Sign Verify page - sign message', async () => {
  test.setTimeout(190000)
  await page.click(
    'li.crypto-item[data-testid="crypto-item"] h5:text("Mintlayer (Testnet)")',
  )
  await page.waitForTimeout(19000)

  // Check if the page is loaded and all the elements are visible
  await page
    .locator('div')
    .filter({ hasText: /^Sign\/Verify$/ })
    .getByTestId('button')
    .click()
  const signMessageButtons = page.getByRole('button', {
    name: 'Sign Message',
  })
  await expect(signMessageButtons).toHaveCount(2)
  await expect(
    page.getByRole('button', { name: 'Verify Message' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Sign Message' }),
  ).toBeVisible()
  await expect(
    page.getByText('Enter the message you want to sign.'),
  ).toBeVisible()
  await expect(
    page
      .locator('div')
      .filter({ hasText: /^Sign MessageEnter the message you want to sign\.$/ })
      .getByTestId('restore-seed-textarea'),
  ).toBeVisible()
  await expect(
    page
      .locator('div')
      .filter({
        hasText: /^Enter your address you want to sign the message with$/,
      })
      .getByTestId('restore-seed-textarea'),
  ).toBeVisible()
  await expect(
    page.getByText('Enter your address you want to sign the message with'),
  ).toBeVisible()
  await expect(page.locator('form').getByTestId('button')).toBeVisible()
  await page.locator('form').getByTestId('button').click()
  await expect(page.getByTestId('error-message')).toBeVisible()

  // Sign message
  await page
    .locator('div')
    .filter({ hasText: /^Sign MessageEnter the message you want to sign\.$/ })
    .getByTestId('restore-seed-textarea')
    .fill(message)

  await page
    .locator('div')
    .filter({
      hasText: /^Enter your address you want to sign the message with$/,
    })
    .getByTestId('restore-seed-textarea')
    .fill(address)

  await page.getByRole('button', { name: 'Sign Message' }).nth(1).click()

  await expect(
    page.getByRole('heading', { name: 'Enter your Password' }),
  ).toBeVisible()
  await expect(page.getByText('Please enter your password to')).toBeVisible()
  await expect(page.getByTestId('input')).toBeVisible()

  await page.fill('input[placeholder="Password"]', senderData.WALLET_PASSWORD)

  await page
    .getByTestId('centered-layout-container')
    .getByTestId('button')
    .click()

  await expect(
    page.getByText('Just a sec, we are validating your password...'),
  ).toBeVisible()

  await expect(
    page.getByText(
      'Your message has been signed successfully. Please save the signed message along with the original message and address for future reference.',
    ),
  ).toBeVisible()
  await expect(page.getByTestId('signed-message-textarea')).toBeVisible()
  await expect(page.getByTestId('signed-message-textarea')).not.toHaveValue('')
})

test('Sign Verify page - verify message', async () => {
  test.setTimeout(190000)
  await page.click(
    'li.crypto-item[data-testid="crypto-item"] h5:text("Mintlayer (Testnet)")',
  )
  await page.waitForTimeout(19000)

  await page
    .locator('div')
    .filter({ hasText: /^Sign\/Verify$/ })
    .getByTestId('button')
    .click()

  // Check if the page is loaded and all the elements are visible
  await page.getByRole('button', { name: 'Verify Message' }).click()
  await expect(
    page.getByRole('heading', { name: 'Verify Message' }),
  ).toBeVisible()
  await expect(page.getByText('Enter the original message')).toBeVisible()
  await expect(
    page
      .locator('div')
      .filter({
        hasText:
          /^Verify MessageEnter the original message you want to verify$/,
      })
      .getByTestId('restore-seed-textarea'),
  ).toBeVisible()
  await expect(page.getByText('Enter address has used to')).toBeVisible()
  await expect(
    page
      .locator('div')
      .filter({ hasText: /^Enter address has used to sign the message$/ })
      .getByTestId('restore-seed-textarea'),
  ).toBeVisible()
  await expect(page.getByText('Enter the signed message you')).toBeVisible()
  await expect(
    page
      .locator('div')
      .filter({ hasText: /^Enter the signed message you want to verify$/ })
      .getByTestId('restore-seed-textarea'),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Verify', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Verify', exact: true }).click()
  await expect(page.getByTestId('error-message')).toBeVisible()
})
