# Mojito Browser Extension

![branch status](https://github.com/mintlayer/mojito-browser-extension/actions/workflows/node.js.yml/badge.svg)

## Setup

Just clone the project, install deps and you are good to go:

```
git clone git@github.com:mintlayer/mojito-browser-extension.git
cd mojito-browser-extension
npm i
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the extension in development mode with HMR (WXT): build output lives in
`.output/chrome-mv3` and the browser auto-reloads extension pages when you
save. Load it once via `chrome://extensions` → _Load unpacked_ →
`.output/chrome-mv3`.

`npm run start:firefox` does the same for Firefox (`.output/firefox-mv3`).

### `npm test`

Runs the Jest unit-test suite.

### `npm run e2e`

Runs E2E tests with Playwright. This will run the tests in headless mode.

#### Developer mode

If you want to create new tests, you can have the visual Playwright interface. To do that, run:

`npm run e2e:ui`.

If you want to debug existing tests, run:

`npm run e2e:debug`.

### `npm run build`

Builds the extension for production to `.output/chrome-mv3` (WXT + Vite).
The build is minified and the filenames include the hashes.

`npm run build:firefox` targets Firefox and `npm run build:staging` builds
with `.env.staging` variables.

## Packaging & Loading

`npm run zip` produces a store-ready archive at
`.output/browser-extension-{version}-chrome.zip` (and `npm run zip:firefox`
the Firefox one).

To load a build manually: `chrome://extensions` → _Load unpacked_ →
`.output/chrome-mv3` (Firefox: `about:debugging` → _Load Temporary Add-on_ →
any file inside `.output/firefox-mv3`).

> Manifest changes (permissions, hosts, entrypoints) require a full
> extension reload in the browser — WXT reloads pages, but Chrome only
> re-reads the manifest on `chrome://extensions` → reload.

## How to Contribute

[Check here](./CONTRIBUTING.md) what you should do, and the rules you should follow, to contribute to this project.
