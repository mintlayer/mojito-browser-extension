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

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run e2e`

Runs E2E tests, with Cypress. It will run them against a web server that runs on the `build` directory. So, **BEFORE** running this command, run:

`npm run build:staging` -> to build the project with test Environment variables on the `build` directory
`npm run serve` -> to run the web server on `build` directory

When the test finishes, it generates screenshots on the path `path/to/screenshots` and videos on `path/to/videos`.

#### Developer mode

If you want to create new tests, you can have the visual Cypress interface. To do that, run:

`npm run dev:e2e`.

Note that it still runs against the same server use on regular E2E tests. So you will need to run the same two commands, `build:staging` and `serve`, listed on the previous section.

### `npm run build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

## After Build

The build process generates a `ext.zip` and a `extFF.zip` files in the project's root directory. The first one should be used for Chromium based browsers, while the last is meant just for Firefox.

They can be imported in the browser as a developer extension on Mozilla Firefox. To test in Chomium-based browsers, you can point the `build` directory as the `unpacked extension`.

### Build specificities

### CSP HTML meta tag

On `public/index.html` there is a `meta` tag named `CSP`. This is tags render just in DEVELOPMENT mode. But it has no use in delevelopment mode.

The only purpose of that tag is to serve as a placeholder to the real `Content-Security-Policy` meta tag, which will be inserted just on the build process for the final packages and the `build` path.

This meta tag is needed to load properly all the external scripts, stylesheets, fonts, and images on the final product.

## How to Contribute

[Check here](./CONTRIBUTING.md) what you should do, and the rules you should follow, to contribute to this project.
