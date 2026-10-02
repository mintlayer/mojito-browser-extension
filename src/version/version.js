/* global __APP_VERSION__ */
// Version is injected at build time (wxt.config.ts vite.define) so the
// page-world bundle never carries package.json metadata. Jest provides the
// same global in src/setupTests.js.
export const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'
