/**
 * Extension manifest factory — single source of truth for every browser
 * target. Previously two static JSON files (manifestDefault.json /
 * manifestFirefox.json) duplicated this data and drifted; now WXT and the
 * manifest spec both consume this module.
 *
 * Differences per target:
 *  - chrome (MV3): side panel UI, `key` pins the Chrome Web Store extension
 *    ID (and thus extension storage) when manifest-key.txt is present,
 *    broad https content-script sweep for the self-healing bridge.
 *  - firefox (MV3): sidebar UI, narrow content-script matches (localhost +
 *    explorer hosts), extra tabs/activeTab permissions, gecko id + keyboard
 *    command.
 */
import fs from 'node:fs'
import path from 'node:path'

// Both consumers (wxt.config.ts via jiti, the Jest spec via babel) run from
// the project root, so cwd is a dependable anchor — `__dirname` is not
// available across the ESM/CJS boundary.
const rootDir = process.cwd()

// CSP directives carry single-quoted keywords; building them keeps
// prettier and the eslint quotes rule from fighting over the enclosing
// quote style of a long literal.
const quoted = (value) => `'${value}'`
const EXTENSION_CSP = [
  `script-src ${quoted('self')} ${quoted('wasm-unsafe-eval')}`,
  `object-src ${quoted('self')}`,
  `img-src ${quoted('self')} data: blob: https://ipfs.io https://dweb.link https://*.dweb.link https://w3s.link https://*.w3s.link`,
  `style-src ${quoted('self')}`,
  `font-src ${quoted('self')}`,
  `style-src-elem ${quoted('self')}`,
].join('; ')

const chromeKey = () => {
  const keyPath = path.resolve(rootDir, 'manifest-key.txt')
  return fs.existsSync(keyPath)
    ? fs.readFileSync(keyPath, 'utf8').trim()
    : undefined
}

export const buildManifest = ({ browser, version }) => {
  const isFirefox = browser === 'firefox'

  const manifest = {
    manifest_version: 3,
    name: 'Mojito - A Mintlayer Wallet',
    version,
    description:
      'Mojito is a non-custodial decentralized crypto wallet that lets you send and receive BTC and ML from any other address.',
    homepage_url: 'https://www.mintlayer.org/',
    icons: {
      16: 'logo16.png',
      32: 'logo32.png',
      96: 'logo96.png',
      128: 'logo128.png',
      192: 'logo192.png',
      512: 'logo512.png',
    },
    content_security_policy: {
      extension_pages: EXTENSION_CSP,
    },
    action: {
      default_icon: 'logo192.png',
      default_title: 'Mojito',
    },
    // The side panel / sidebar UI — entrypoints/index.html outputs index.html,
    // matching the pre-WXT manifests (and giving the E2E server a root page).
    ...(isFirefox
      ? {
          sidebar_action: {
            default_icon: 'logo192.png',
            default_title: 'Mojito',
            default_panel: 'index.html',
          },
        }
      : {
          short_name: 'Mojito',
          side_panel: {
            default_path: 'index.html',
          },
        }),
    ...(isFirefox
      ? {
          permissions: ['activeTab', 'tabs', 'storage'],
          host_permissions: [
            '*://blockexplorer-staging.mintlayer.org/*',
            '*://explorer.mintlayer.org/*',
            '*://localhost/*',
            '*://lovelace.explorer.mintlayer.org/*',
            'https://mojito-api.mintlayer.org/*',
            'https://price-feed-api.mintlayer.org/*',
            'https://rates-api.mintlayer.org/*',
          ],
          content_scripts: [
            {
              run_at: 'document_start',
              all_frames: true,
              matches: [
                '*://localhost/*',
                '*://explorer.mintlayer.org/*',
                '*://lovelace.explorer.mintlayer.org/*',
                '*://blockexplorer-staging.mintlayer.org/*',
              ],
              js: ['explorer-content.js'],
            },
          ],
          web_accessible_resources: [
            {
              resources: ['mojito.js'],
              matches: ['*://localhost/*', '*://*.mintlayer.org/*'],
            },
          ],
          commands: {
            _execute_action: {
              suggested_key: {
                default: 'Ctrl+Shift+Y',
              },
            },
          },
          browser_specific_settings: {
            gecko: {
              id: 'browserextension@mintlayer',
              strict_min_version: '109.0',
            },
          },
        }
      : {
          // `key` keeps the Chrome Web Store extension ID (and thus the
          // extension storage) stable across unpacked builds.
          ...(chromeKey() ? { key: chromeKey() } : {}),
          permissions: ['scripting', 'storage', 'sidePanel'],
          host_permissions: [
            'https://mojito-api.mintlayer.org/*',
            'https://price-feed-api.mintlayer.org/*',
            'https://rates-api.mintlayer.org/*',
          ],
          content_scripts: [
            {
              run_at: 'document_start',
              all_frames: false,
              matches: [
                'https://*/*',
                'http://localhost/*',
                'http://127.0.0.1/*',
                'https://explorer.mintlayer.org/*',
                'https://lovelace.explorer.mintlayer.org/*',
                'https://blockexplorer-staging.mintlayer.org/*',
              ],
              js: ['explorer-content.js'],
            },
          ],
          web_accessible_resources: [
            {
              resources: ['mojito.js'],
              matches: [
                'https://*/*',
                'http://localhost/*',
                'http://127.0.0.1/*',
              ],
            },
          ],
        }),
  }

  return manifest
}
