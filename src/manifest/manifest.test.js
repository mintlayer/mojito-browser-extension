/**
 * Tests for the extension manifest factory (src/manifest/manifest.js), the
 * single source of truth that replaced the static manifestDefault.json /
 * manifestFirefox.json pair (both deleted in the WXT migration). It covers
 * the bridge-integration contract: MV3 shape, CSP/WASM, content-script
 * injection, first-party-only host permissions, and the per-browser deltas
 * (chrome side panel + store key, firefox sidebar + gecko settings).
 */
const fs = require('node:fs')
const path = require('path')

const { buildManifest } = require('./manifest.js')

const { version: APP_VERSION } = require('../../package.json')

const chromium = buildManifest({ browser: 'chrome', version: APP_VERSION })
const firefox = buildManifest({ browser: 'firefox', version: APP_VERSION })

describe('extension manifest (bridge integration contract)', () => {
  describe('shared invariants (both browsers)', () => {
    it('exposes the package version (was a duplicated literal in the JSON manifests)', () => {
      expect(chromium.version).toBe(APP_VERSION)
      expect(firefox.version).toBe(APP_VERSION)
    })

    it('keeps name and description identical across browsers', () => {
      expect(chromium.name).toBe(firefox.name)
      expect(chromium.description).toBe(firefox.description)
      expect(chromium.name).toBe('Mojito - A Mintlayer Wallet')
      expect(chromium.description).toMatch(/non-custodial/)
    })

    it('is valid MV3', () => {
      expect(chromium.manifest_version).toBe(3)
      expect(firefox.manifest_version).toBe(3)
    })

    it.each([
      ['chromium', chromium],
      ['firefox', firefox],
    ])('%s manifest allows wasm without unsafe-eval', (_name, manifest) => {
      const csp = manifest.content_security_policy.extension_pages

      // The SDK and the wallet itself compile WASM — MV3 requires
      // 'wasm-unsafe-eval'; 'unsafe-eval' must never appear.
      expect(csp).toContain("'wasm-unsafe-eval'")
      expect(csp).not.toContain("'unsafe-eval'")
      expect(csp).toContain("script-src 'self'")
      expect(csp).toContain("object-src 'self'")
    })

    it.each([
      ['chromium', chromium],
      ['firefox', firefox],
    ])(
      '%s injects the explorer content script at document_start',
      (_name, manifest) => {
        const script = manifest.content_scripts[0]
        // window.mojito must exist before page scripts run (race-on-load)
        expect(script.run_at).toBe('document_start')
        expect(script.js).toContain('explorer-content.js')
      },
    )
  })

  describe('chromium', () => {
    it('pins the Chrome Web Store extension ID via `key` when manifest-key.txt exists', () => {
      const keyPath = path.resolve(process.cwd(), 'manifest-key.txt')
      if (!fs.existsSync(keyPath)) {
        // No key file (e.g. fresh clone / CI): the factory must omit `key`
        expect(chromium.key).toBeUndefined()
        return
      }
      expect(chromium.key).toBe(fs.readFileSync(keyPath, 'utf8').trim())
    })

    it('uses the side panel as the approval surface', () => {
      expect(chromium.side_panel.default_path).toBe('index.html')
      expect(chromium.sidebar_action).toBeUndefined()
    })

    it('grants the scripting/storage/sidePanel permissions', () => {
      expect(chromium.permissions).toEqual(
        expect.arrayContaining(['scripting', 'storage', 'sidePanel']),
      )
    })

    it('sweeps https pages in the top frame only (self-healing injection)', () => {
      const script = chromium.content_scripts[0]
      expect(script.all_frames).toBe(false)
      for (const match of script.matches) {
        const scheme = match.split('://')[0]
        expect(['https', 'http', 'urn']).toContain(scheme)
        if (scheme === 'http') {
          // plain http is only allowed for local development
          expect(match).toMatch(/^http:\/\/(localhost|127\.0\.0\.1)\//)
        }
      }
    })

    it('exposes only mojito.js to pages, not <all_urls>', () => {
      const war = chromium.web_accessible_resources[0]
      expect(war.resources).toEqual(['mojito.js'])
      expect(war.matches).not.toContain('<all_urls>')
    })
  })

  describe('firefox', () => {
    it('uses the sidebar as the approval surface', () => {
      expect(firefox.sidebar_action.default_panel).toBe('index.html')
      expect(firefox.side_panel).toBeUndefined()
    })

    it('grants the activeTab/tabs/storage permissions', () => {
      expect(firefox.permissions).toEqual(
        expect.arrayContaining(['activeTab', 'tabs', 'storage']),
      )
    })

    it('declares the gecko extension id', () => {
      expect(firefox.browser_specific_settings.gecko.id).toBe(
        'browserextension@mintlayer',
      )
    })

    it('narrowly matches the explorer/localhost hosts', () => {
      const script = firefox.content_scripts[0]
      // Firefox has no broad sweep: matches stay on first-party origins
      for (const match of script.matches) {
        expect(match).toMatch(/mintlayer\.org|localhost/)
      }
    })

    it('exposes only mojito.js to pages, not <all_urls>', () => {
      const war = firefox.web_accessible_resources[0]
      expect(war.resources).toEqual(['mojito.js'])
      expect(war.matches).not.toContain('<all_urls>')
    })
  })

  describe('API host permissions (network contract)', () => {
    // First-party APIs the wallet talks to. This is the whole network
    // contract: no broader host access may be granted.
    const API_HOSTS = [
      'https://mojito-api.mintlayer.org/*',
      'https://price-feed-api.mintlayer.org/*',
      'https://rates-api.mintlayer.org/*',
    ]

    // Firefox still carries pre-contract explorer/localhost grants with a
    // wildcard scheme. They are exempt from the https-only rule; anything
    // newly added must be https.
    const FIREFOX_LEGACY_HOSTS = [
      '*://blockexplorer-staging.mintlayer.org/*',
      '*://explorer.mintlayer.org/*',
      '*://localhost/*',
      '*://lovelace.explorer.mintlayer.org/*',
    ]

    it.each([
      ['chromium', chromium],
      ['firefox', firefox],
    ])('%s manifest declares the first-party API hosts', (_name, manifest) => {
      expect(Array.isArray(manifest.host_permissions)).toBe(true)
      expect(manifest.host_permissions).toEqual(
        expect.arrayContaining(API_HOSTS),
      )
    })

    it('chromium grants exactly the three API hosts, nothing more', () => {
      expect(chromium.host_permissions).toHaveLength(API_HOSTS.length)
      expect(chromium.host_permissions).toEqual(
        expect.arrayContaining(API_HOSTS),
      )
    })

    it('keeps host permissions https-only (firefox legacy entries exempt)', () => {
      for (const entry of chromium.host_permissions) {
        expect(entry).toMatch(/^https?:\/\//)
      }

      const legacy = new Set(FIREFOX_LEGACY_HOSTS)
      for (const entry of firefox.host_permissions) {
        if (!legacy.has(entry)) {
          expect(entry).toMatch(/^https?:\/\//)
        }
      }
    })

    it.each([
      ['chromium', chromium],
      ['firefox', firefox],
    ])(
      '%s never grants <all_urls> or all-hosts wildcards',
      (_name, manifest) => {
        for (const entry of manifest.host_permissions) {
          expect(entry).not.toBe('<all_urls>')
          expect(entry).not.toBe('*/*')
          // A '*' scheme paired with a '*' host would grant every origin.
          // Firefox's legacy '*://' entries are host-scoped, so they pass.
          expect(entry).not.toMatch(/^\*:\/\/\*\/\*$/)
        }
      },
    )
  })
})
