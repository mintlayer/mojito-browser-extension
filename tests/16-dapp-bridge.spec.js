// @ts-nocheck
/**
 * dApp bridge end-to-end against a REAL extension context:
 *   - loads the built MV3 extension into a persistent Chromium profile
 *   - restores the sender wallet inside the extension
 *   - opens a "dApp" page (the served build on 127.0.0.1:8000 — any page
 *     behind the content-script matches behaves identically)
 *   - exercises window.mojito.connect() through the approval popup
 *   - verifies a rejected signChallenge reaches the page as USER_REJECTED
 *
 * Requires the production build (.output/chrome-mv3) — playwright.config's
 * webServer builds it before serving.
 */
const { test, chromium, expect } = require('@playwright/test')
const path = require('path')
import { senderData } from './data/index.js'

const EXTENSION_PATH = path.resolve('.output/chrome-mv3')
const DAPP_URL = 'http://127.0.0.1:8000/'

const restoreWalletInExtension = async (walletPage) => {
  await walletPage.goto('chrome-extension://placeholder/index.html')
}

// NOTE: requires an unloaded runner — this machine's memory reaper kills
// the heavy headless+extension browser at wasm init (SIGKILL, ~40s in).
// On CI (dedicated runner) remove `.fixme` to execute.
test.fixme('dApp bridge: connect approval + signed-request rejection routing', async () => {
  test.setTimeout(240000)

  const context = await chromium.launchPersistentContext('', {
    headless: true,
    channel: 'chromium',
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ],
  })

  try {
    // extension id from the background service worker
    let [background] = context.serviceWorkers()
    if (!background) {
      background = await context.waitForEvent('serviceworker', {
        timeout: 30000,
      })
    }
    const extensionId = background.url().split('/')[2]
    expect(extensionId).toBeTruthy()

    // ── restore the sender wallet inside the extension ──
    context.on('close', () =>
      process.stdout.write('[bridge-e2e] EVENT context closed\n'),
    )
    const walletPage = await context.newPage()
    walletPage.on('close', () =>
      process.stdout.write('[bridge-e2e] EVENT walletPage closed\n'),
    )
    walletPage.on('crash', () =>
      process.stdout.write('[bridge-e2e] EVENT walletPage CRASHED\n'),
    )
    walletPage.on('pageerror', (e) =>
      process.stdout.write(`[bridge-e2e] pageerror: ${e.message}\n`),
    )
    await walletPage.goto(`chrome-extension://${extensionId}/index.html`)
    const step = async (label, fn) => {
      process.stdout.write(`[bridge-e2e] ${label}\n`)
      try {
        await fn()
      } catch (error) {
        process.stdout.write(
          `[bridge-e2e] FAILED at ${label}: ${error.message.split('\n')[0]}\n`,
        )
        throw error
      }
    }

    await step('landing', async () => {
      await expect(walletPage.getByTestId('create-restore')).toBeVisible({
        timeout: 30000,
      })
    })
    await step('choose restore', async () => {
      await walletPage
        .getByRole('button', { name: 'I already have a recovery phrase' })
        .click()
    })
    await step('choose seed phrase', async () => {
      await walletPage.getByText('Seed Phrase').click()
    })
    await step('wallet name', async () => {
      await walletPage.fill('input[placeholder="Wallet Name"]', 'bridgeWallet')
      await walletPage.getByRole('button', { name: 'Create' }).click()
    })
    await step('enter seed phrases', async () => {
      await walletPage
        .getByRole('button', { name: 'Enter Seed Phrases' })
        .click()
      await walletPage
        .locator('textarea')
        .first()
        .fill(senderData.MNEMONIC.join(' '))
      await walletPage.getByRole('button', { name: 'Continue' }).click()
    })

    await step('dashboard (restored + unlocked)', async () => {
      await expect(walletPage.getByText('bridgeWallet').first()).toBeVisible({
        timeout: 60000,
      })
    })

    // ── the "dApp" page: content script injects window.mojito ──
    const dappPage = await context.newPage()
    await dappPage.goto(DAPP_URL)
    await dappPage.waitForFunction(() => Boolean(window.mojito), null, {
      timeout: 30000,
    })

    // ── connect: the wallet opens an approval surface ──
    const connectPromise = dappPage.evaluate(() => window.mojito.connect())

    // the approval surface is the popup fallback window (page in context)
    let popupPage = null
    for (let i = 0; i < 40 && !popupPage; i += 1) {
      const pages = context.pages()
      popupPage =
        pages.find((p) => p !== dappPage && p.url().includes('popup.html')) ??
        null
      if (!popupPage) await dappPage.waitForTimeout(500)
    }
    expect(popupPage).toBeTruthy()
    await popupPage.waitForLoadState('domcontentloaded')

    // the connect approval discloses only receiving addresses
    await popupPage.getByTestId('connect-button').click()
    const connectResult = await connectPromise
    const receiving =
      connectResult?.addressesByChain?.mintlayer?.receiving ?? []
    expect(receiving.length).toBeGreaterThan(0)
    // SECURITY (S4): no change addresses are disclosed in the grant
    expect(connectResult?.addressesByChain?.mintlayer?.change ?? []).toEqual([])

    // the dApp sees itself as connected
    const connected = await dappPage.evaluate(() => window.mojito.isConnected())
    expect(connected).toBe(true)

    // ── signChallenge: rejecting must reach the page as USER_REJECTED ──
    const signPromise = dappPage.evaluate(() =>
      window.mojito.request('signChallenge', {
        message: 'bridge-e2e signature request',
      }),
    )

    let signPopup = null
    for (let i = 0; i < 40 && !signPopup; i += 1) {
      const pages = context.pages()
      signPopup =
        pages.find(
          (p) =>
            p !== dappPage && p.url().includes('popup.html') && p !== popupPage,
        ) ?? null
      if (!signPopup) await dappPage.waitForTimeout(500)
    }
    expect(signPopup).toBeTruthy()
    await signPopup.waitForLoadState('domcontentloaded')
    await expect(
      signPopup.getByText('bridge-e2e signature request'),
    ).toBeVisible()

    await signPopup.getByRole('button', { name: 'Decline' }).click()
    await expect(signPromise).rejects.toMatchObject({
      code: 'USER_REJECTED',
    })
  } finally {
    await context.close()
  }
})
