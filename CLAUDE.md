# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Mojito is a **non-custodial** Bitcoin + Mintlayer wallet shipped as a Manifest V3 browser extension for both Chromium browsers and Firefox. Seeds and private keys never leave the device: everything is encrypted at rest in IndexedDB and decrypted only in memory during an unlock. There is no server to fall back on, so a bug that corrupts or mis-encrypts a stored account destroys funds permanently. Treat anything under `src/services/Crypto` and `src/services/Entity/Account` accordingly.

Node 18 (`.nvmrc`).

## Commands

```bash
npm start                  # webpack dev server on :3000
npm run build              # production build + packing.sh -> build/, ext.zip, extFF.zip
npm test                   # jest (NODE_ENV=test)
npm run lint               # eslint
npm run pretty-quick       # prettier
npm run e2e                # playwright, headless
npm run e2e:ui             # playwright, visual runner
```

A single test file or test:

```bash
npx jest src/services/Crypto/Cipher/Cipher.test.js
npx jest src/services/Entity/Account -t "unlocks with a passkey"
npx jest --coverage --collectCoverageFrom='src/services/Crypto/Cipher/Cipher.js'
```

The pre-commit hook runs prettier, eslint and the whole suite, so all three must be green before a commit will land.

Jest ignores `/tests/` (Playwright lives there) and `src/pages`.

## Build layout

`webpack.config.js` emits only `index.html`. `packing.sh` then copies it to **`popup.html`** and swaps in the per-browser manifest before zipping. Two consequences:

- `popup.html` does not exist under `npm start`. Any code path that opens it 404s in dev.
- `public/manifestDefault.json` (Chromium) and `public/manifestFirefox.json` are separate files; whichever is being renamed to `manifest.json` at packing time wins. Changes must usually be made in both.

The same `index.html` is the side panel (`side_panel.default_path` on Chromium, `sidebar_action.default_panel` on Firefox) and `popup.html` is the standalone tab. `src/index.js` and `AccountProvider` branch on `window.location.href.includes('popup.html')` to tell the two apart. Routing is `MemoryRouter`, so **the URL carries no route** — opening a new document always starts the app at its initial screen.

## Path aliases

Defined three times and kept in sync by hand: `jsconfig.json`, the `aliases` object in `webpack.config.js`, and `moduleNameMapper` in `jest.config.js`. Adding an alias means editing all three.

`@BasicComponents` `@ComposedComponents` `@LayoutComponents` `@ContainerComponents` `@Contexts` `@Hooks` `@Pages` `@APIs` `@Cryptos` `@Databases` `@Entities` `@Helpers` `@Constants` `@Storage` `@TestData` `@Assets` `@Version`

## Architecture

### Layering (enforced by convention, see CONTRIBUTING.md)

`basic` → `composed` → `layouts` are generic and must stay free of app logic. Only `containers` may hold page-specific logic. **Components must not import `@APIs`, `@Databases`, `@Cryptos` or `@Entities` directly** — those belong behind `@Entities`, which pages wire into containers via props.

### The Account entity is the hub

`src/services/Entity/Account/Account.js` owns every read and write of a stored account: creation, unlock, passkey enrolment, HTLC secrets and the encryption-version migration. Nothing else should write to the accounts store.

Concurrency is guarded by `withAccountLock(id, task)`, an in-module promise chain. It only serialises within one document — the side panel, a standalone tab and the background worker each run their own module instance, so cross-document writes are still last-writer-wins. When a value is derived from the stored record, read it again immediately before the write.

### Envelope encryption (version 4)

A random 32-byte **DEK** encrypts the content (BTC seed, both ML private keys, HTLC secrets). The DEK is then wrapped separately by each credential that may unlock the wallet:

- password → PBKDF2-SHA512, 600k iterations → `wrappedDek.password`
- each passkey → WebAuthn PRF output → HKDF-SHA256 → `wrappedDek.passkeys[]`

Every AES-GCM operation is bound with `additionalData`, built by `contentAad` / `wrapperAad` / `htlsAad` in `Cipher.js`. These strings and the KDF parameters are a **storage format**: changing them consistently across encrypt and decrypt keeps round-trip tests green while making every already-stored wallet unopenable. They are pinned by known-answer tests in `Cipher.test.js` — if one of those fails, the change breaks existing users, not the test.

Versions 1/2/3 are pre-envelope (content encrypted directly with the password key). `getAccountVersion` defaults a missing field to 1, `isEnvelope()` gates behaviour, and `aadFor()` returns `undefined` for pre-v4 records so legacy ciphertext still opens. Migration to v4 happens opportunistically on a successful unlock and is deliberately swallowed on failure: a failed migration must leave the account on its old version rather than deny access to a wallet that just decrypted fine.

### Web Workers, and why tests do not see them

`EnvVars.USE_WEB_WORKERS` is `process.env.NODE_ENV !== 'test'`. `loadAccountSubRoutines()` returns worker-backed functions in the browser and direct imports under jest, because jest cannot handle `new Worker(new URL(..., import.meta.url))`.

**The production path is therefore invisible to ordinary tests.** A bug that only exists in the worker plumbing — a dropped argument, a swallowed error — passes the whole suite. `Account.workerPath.test.js` exists to cover that path by stubbing `global.Worker` and driving the real worker modules; extend it when touching `Account.worker.js`.

Workers report failure through the envelope in `src/services/Crypto/Worker/WorkerContract.js`. The marker is `__workerError` rather than `error` because Mintlayer API payloads legitimately carry an `error` field.

### Storage

`IndexedDB.js` holds `SCHEMAVERSION` and the `accounts` store. Migrations run **inside the `versionchange` transaction** in `createOrUpdateDatabase`, gated on `event.oldVersion`, and `oldVersion === 0` returns early because a brand-new database has nothing to migrate. Migrations in `src/services/Database/migrations/migrations.js` are pure per-account transforms applied in sequence over a single read — issuing separate `getAll()` calls per migration makes a later one overwrite an earlier one's work.

### Test environment

Real Mintlayer wasm runs under jest via `src/tests/helpers/initWasm.js`; call `initWasm()` in `beforeAll`. `babel.config.js` stubs `import.meta` in the test env only. `jest.config.js` maps bare `buffer` to the npm polyfill so `Buffer` instances match the realm the wasm bindings validate against.

Network-backed code is not testable as-is: `ML.getWalletAddresses` loops until the API reports an unused address, so without a stubbed response it spins until the heap dies. Assert on decrypted key material instead of on generated addresses.

## Conventions

- Branches `A-[asana id]`, PR titles `A-[asana id]: description`, base branch `dev`, squash merge.
- Plain JS is the default. Some newer files are `.tsx`; do not convert existing JS to TypeScript.
- CSS Modules for new components. No `:global()`.
- Each component lives in its own folder with its own test and CSS file.
