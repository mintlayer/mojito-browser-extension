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

### `npm run build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

## After Build

The build process generates a `ext.zip` and a `extFF.zip` files in the project's root directory. The first one should be used for Chromium based browsers, while the last is meant just for Firefox.
They can be imported in the browser as a developer extension on Mozilla Firefox. To test in Chomium-based browsers, you can point the `build` directory as the `unpacked extension`.

## How to Contribute

[Check here](./CONTRIBUTING.md) what you should do, and the rules you should follow, to contribute to this project.
