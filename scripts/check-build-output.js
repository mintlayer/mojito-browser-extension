#!/usr/bin/env node
/**
 * Asserts the built extension bundles contain every page the code opens at
 * runtime. Regression guard: the background opens `runtime.getURL('popup.html')`
 * as the approval-window fallback (src/background/main.js) — the webpack→WXT
 * migration silently dropped that entrypoint, so the fallback opened a dead
 * page and dApp connect approvals surfaced as the wallet dashboard instead
 * of a permission prompt. A missing page here fails CI before it can ship.
 *
 * Usage: node scripts/check-build-output.js [.output/chrome-mv3] [...]
 * (defaults to every built target directory under .output)
 */
const fs = require('fs')
const path = require('path')

const OUTPUT_DIR = path.resolve(__dirname, '..', '.output')

// Pages referenced by runtime code (keep in sync with the source):
const REQUIRED_PAGES = ['index.html', 'popup.html']

const targets = process.argv.slice(2)
const dirs = targets.length
  ? targets
  : fs
      .readdirSync(OUTPUT_DIR)
      .filter((name) => fs.statSync(path.join(OUTPUT_DIR, name)).isDirectory())
      .map((name) => path.join(OUTPUT_DIR, name))

if (dirs.length === 0) {
  console.error(
    'check-build-output: no build output found — run `npm run build` first',
  )
  process.exit(1)
}

let failed = false
for (const dir of dirs) {
  const label = path.relative(path.dirname(OUTPUT_DIR), dir)
  for (const page of REQUIRED_PAGES) {
    if (fs.existsSync(path.join(dir, page))) {
      console.log(`  OK    ${label}/${page}`)
    } else {
      console.error(`  MISS  ${label}/${page} — required at runtime`)
      failed = true
    }
  }
}

if (failed) {
  console.error(
    '\ncheck-build-output: FAILED — an entrypoint dropped out of the build. ' +
      'Add it back under src/entrypoints/ (see scripts/check-build-output.js header).',
  )
  process.exit(1)
}
console.log('\ncheck-build-output: all required pages present')
