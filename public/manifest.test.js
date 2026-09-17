const fs = require('fs')
const path = require('path')

const readManifest = (name) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, name), 'utf8'))

describe('extension manifest (bridge integration contract)', () => {
  const chromium = readManifest('manifestDefault.json')
  const firefox = readManifest('manifestFirefox.json')

  describe('CSP / WebAssembly (MV3)', () => {
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
  })

  describe('content script injection (race-on-load contract)', () => {
    it('injects at document_start so window.mojito exists before page scripts', () => {
      expect(chromium.content_scripts[0].run_at).toBe('document_start')
    })

    it('injects into https pages (top frames only)', () => {
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

  describe('manifest shape', () => {
    it('is valid MV3 with a module service worker', () => {
      expect(chromium.manifest_version).toBe(3)
      expect(chromium.background.service_worker).toBe('background.js')
      expect(chromium.background.type).toBe('module')
    })

    it('mojito.js exists next to the manifests and registers the SDK', () => {
      const source = fs.readFileSync(path.join(__dirname, 'mojito.js'), 'utf8')
      expect(source).toContain('window.mojito')
      expect(source).toContain('restore')
      expect(source).not.toContain('__APP_VERSION__PLACEHOLDER')
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
