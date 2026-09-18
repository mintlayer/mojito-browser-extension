import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'wxt'
import { transformWithOxc } from 'vite'
import svgr from '@svgr/core'
import esbuild from 'esbuild'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { buildManifest } from './src/manifest/manifest.js'

// package.json version → manifest version (npm does not always set
// npm_package_version when the CLI is invoked through npx).
const pkgVersion = (): string => {
  const pkg = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'),
  )
  return pkg.version
}

// Path aliases — mirrors jsconfig.json.
const aliases = {
  '@BasicComponents': path.resolve(__dirname, 'src/components/basic/index.js'),
  '@ComposedComponents': path.resolve(
    __dirname,
    'src/components/composed/index.js',
  ),
  '@LayoutComponents': path.resolve(
    __dirname,
    'src/components/layouts/index.js',
  ),
  '@ContainerComponents': path.resolve(
    __dirname,
    'src/components/containers/index.js',
  ),
  '@Assets': path.resolve(__dirname, 'src/assets'),
  '@Contexts': path.resolve(__dirname, 'src/contexts/index.js'),
  '@Hooks': path.resolve(__dirname, 'src/hooks/index.js'),
  '@Pages': path.resolve(__dirname, 'src/pages/index.js'),
  '@APIs': path.resolve(__dirname, 'src/services/API/index.js'),
  '@Cryptos': path.resolve(__dirname, 'src/services/Crypto/index.js'),
  '@Databases': path.resolve(__dirname, 'src/services/Database/index.js'),
  '@Entities': path.resolve(__dirname, 'src/services/Entity/index.js'),
  '@Browser': path.resolve(__dirname, 'src/services/Browser/index.js'),
  '@Helpers': path.resolve(__dirname, 'src/utils/Helpers/index.js'),
  '@Constants': path.resolve(__dirname, 'src/utils/Constants/index.js'),
  '@TestData': path.resolve(__dirname, 'src/utils/TestData/index.js'),
  '@Storage': path.resolve(__dirname, 'src/services/Storage/index.js'),
  '@Version': path.resolve(__dirname, 'src/version/version.js'),
}

const viteAlias = Object.entries(aliases).map(([find, replacement]) => ({
  find,
  replacement,
}))

/**
 * Environment variables.
 *
 * The old webpack Dotenv plugin inlined `process.env.*` at build time from
 * .env (dev) / .env.production / .env.staging. Same contract here: values
 * are statically replaced for the app, and Jest keeps reading .env directly
 * via jest.config.js. `wxt build --mode staging` picks .env.staging.
 */
const envFiles: Record<string, string> = {
  development: '.env',
  staging: '.env.staging',
  production: '.env.production',
}

const envDefine = (mode: string): Record<string, string> => {
  const file = envFiles[mode] ?? '.env'
  const filePath = path.resolve(__dirname, file)
  if (!fs.existsSync(filePath)) return {}
  const parsed = fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .reduce<Record<string, string>>((acc, line) => {
      const eq = line.indexOf('=')
      if (eq === -1) return acc
      const key = line.slice(0, eq).trim()
      let value = line.slice(eq + 1).trim()
      if (
        (value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))
      ) {
        value = value.slice(1, -1)
      }
      acc[key] = value
      return acc
    }, {})
  return Object.fromEntries(
    Object.entries(parsed).map(([key, value]) => [
      `process.env.${key}`,
      JSON.stringify(value),
    ]),
  )
}

/**
 * CRA-style SVG imports: `import { ReactComponent as Icon } from './x.svg'`
 * (plus a default export). Rendered through svgr and compiled with esbuild
 * so no JSX ever reaches Vite's pipeline for a .svg module.
 */
const svgrReactComponent = (): any => ({
  name: 'mojito:svgr-react-component',
  enforce: 'pre',
  async transform(_code: string, id: string) {
    const [file] = id.split('?')
    if (!file.endsWith('.svg')) return
    const svg = fs.readFileSync(file, 'utf8')
    const jsx = await svgr.transform(
      svg,
      {
        exportType: 'named',
        jsxRuntime: 'automatic',
        plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
        svgoConfig: {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  removeViewBox: false,
                },
              },
            },
          ],
        },
      },
      { componentName: 'ReactComponent' },
    )
    const compiled = await transformWithOxc(jsx, 'ReactComponent.jsx')
    return compiled.code
  },
})

/**
 * CRA-era codebase: JSX lives in .js files. Rolldown's builtin transform
 * keeps JSX disabled for plain .js, so compile it up front with esbuild
 * (automatic runtime) before the builtin transform ever sees it.
 */
const jsxInJs = (): any => ({
  name: 'mojito:jsx-in-js',
  enforce: 'pre',
  async transform(code: string, id: string) {
    if (!id.endsWith('.js') || id.includes('node_modules')) return
    if (!code.includes('<')) return
    try {
      return await esbuild.transform(code, {
        loader: 'jsx',
        jsx: 'automatic',
        sourcefile: id,
        sourcemap: true,
      })
    } catch {
      // Not actually JSX-capable content (or a syntax the loader rejects
      // for other reasons) — let the normal pipeline surface the error.
      return null
    }
  },
})

export default defineConfig({
  srcDir: 'src',
  // No auto-imports: the codebase stays explicit.
  imports: false,
  // MV3 for every target (chrome service worker; firefox event-page-style
  // background.scripts + sidebar_action, matching the old manifests).
  manifestVersion: 3,
  manifest: (env) =>
    buildManifest({
      browser: env.browser,
      version: process.env.npm_package_version ?? pkgVersion(),
    }),
  aliases,
  vite: (env) => ({
    plugins: [
      react(),
      jsxInJs(),
      svgrReactComponent(),
      nodePolyfills({
        // crypto -> crypto-browserify, stream/vm/buffer fallbacks, plus
        // global `process`/`Buffer` — the wallet's crypto stack needs them.
        globals: { process: true, Buffer: true },
        protocolImports: true,
      }),
    ],
    define: envDefine(env.mode),
    // Worker bundles run through their own plugin pipeline.
    worker: {
      format: 'es',
      plugins: () => [jsxInJs(), svgrReactComponent()],
    },
    resolve: {
      alias: viteAlias,
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.mjs', '.wasm'],
    },
    build: {
      // No source maps in production: shipping full unminified sources with
      // a wallet package only helps attackers.
      sourcemap: env.mode === 'development',
    },
  }),
})
