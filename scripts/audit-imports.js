#!/usr/bin/env node
/**
 * Audits every local import in src/ for:
 *  - unresolved modules (bad paths / aliases)
 *  - named imports that the target module does not export
 * Covers `import … from`, `export … from`, `require()` destructures are ignored.
 * node_modules packages are skipped (those are verified by the bundler/lockfile).
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')

const ALIASES = {
  '@Assets': 'src/assets',
  '@BasicComponents': 'src/components/basic/index.js',
  '@ComposedComponents': 'src/components/composed/index.js',
  '@ContainerComponents': 'src/components/containers/index.js',
  '@LayoutComponents': 'src/components/layouts/index.js',
  '@Constants': 'src/utils/Constants/index.js',
  '@Helpers': 'src/utils/Helpers/index.js',
  '@TestData': 'src/utils/TestData/index.js',
  '@Hooks': 'src/hooks/index.js',
  '@Contexts': 'src/contexts/index.js',
  '@Databases': 'src/services/Database/index.js',
  '@Cryptos': 'src/services/Crypto/index.js',
  '@Entities': 'src/services/Entity/index.js',
  '@APIs': 'src/services/API/index.js',
  '@Storage': 'src/services/Storage/index.js',
  '@Browser': 'src/services/Browser/index.js',
  '@Version': 'src/version/version.js',
  '@Mocks': 'src/mocks/index.js',
  '@Pages': 'src/pages/index.js',
}

const EXT_ORDER = ['.js', '.ts', '.tsx', '.jsx', '.mjs', '.css', '.json']

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === 'node_modules' ||
      entry.name.startsWith('@mintlayerlib-js')
    )
      continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(js|ts|tsx|jsx)$/.test(entry.name)) out.push(full)
  }
  return out
}

const resolveModule = (spec, fromFile) => {
  let base
  if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec)
  else if (spec.startsWith('src/')) base = path.join(ROOT, spec)
  else if (ALIASES[spec]) base = path.join(ROOT, ALIASES[spec])
  else if (
    spec.split('/').length > 1 &&
    Object.keys(ALIASES).some((a) => spec.startsWith(a + '/'))
  ) {
    const alias = Object.keys(ALIASES).find((a) => spec.startsWith(a + '/'))
    base = path.join(ROOT, ALIASES[alias], spec.slice(alias.length + 1))
  } else return { external: true }

  try {
    if (
      fs.statSync(base).isDirectory() &&
      fs.existsSync(path.join(base, 'package.json'))
    ) {
      return { file: path.join(base, 'package.json'), opaque: true }
    }
  } catch {}
  const candidates = [base, ...EXT_ORDER.map((ext) => base + ext)]
  for (const ext of EXT_ORDER) {
    candidates.push(path.join(base, `index${ext}`))
  }
  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) return { file: candidate }
    } catch {}
  }
  return {}
}

const cache = new Map()
const exportsOf = (file) => {
  if (cache.has(file)) return cache.get(file)
  const names = new Set()
  let hasDefault = false
  try {
    const src = fs.readFileSync(file, 'utf8')
    hasDefault = /export\s+default/.test(src) || /module\.exports/.test(src)
    // export { a, b as c } [from '...'] and export type { ... }
    for (const m of src.matchAll(
      /export\s+(?:type\s+)?\{([^}]*)\}(?:\s*from\s*['"]([^'"]+)['"])?/g,
    )) {
      for (const part of m[1].split(',')) {
        const name = part
          .split(/\s+as\s+/)
          .pop()
          .trim()
        if (name) names.add(name)
      }
    }
    for (const m of src.matchAll(
      /export\s+(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z0-9_$]+)/g,
    )) {
      names.add(m[1])
    }
    for (const m of src.matchAll(
      /export\s+(?:type|interface|enum)\s+([A-Za-z0-9_$]+)/g,
    )) {
      names.add(m[1])
    }
    // export * from './x' — treat as "has everything" (opaque)
    if (/export\s*\*\s*from/.test(src)) names.add('*')
  } catch {}
  const result = { names, hasDefault }
  cache.set(file, result)
  return result
}

const IMPORT_RE =
  /import\s+(?:([A-Za-z0-9_$]+)\s*,?\s*)?(?:\{([^}]*)\}\s*)?(?:\*\s+as\s+[A-Za-z0-9_$]+\s*)?from\s*['"]([^'"]+)['"]/g
const EXPORT_FROM_RE = /export\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g

const problems = []
const files = walk(SRC)

for (const file of files) {
  const src = fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n')
  const specs = []
  for (const m of src.matchAll(IMPORT_RE)) {
    specs.push({
      names: [
        ...(m[1] ? ['default:' + m[1]] : []),
        ...(m[2] || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      ],
      spec: m[3],
    })
  }
  for (const m of src.matchAll(EXPORT_FROM_RE)) {
    specs.push({
      names: m[1]
        .split(',')
        .map((s) =>
          s
            .trim()
            .split(/\s+as\s+/)
            .pop(),
        )
        .filter(Boolean),
      spec: m[2],
    })
  }

  for (const { names, spec } of specs) {
    if (!spec) continue
    const resolved = resolveModule(spec, file)
    if (resolved.external) continue
    if (!resolved.file) {
      problems.push(`${path.relative(ROOT, file)}: unresolved module '${spec}'`)
      continue
    }
    if (
      resolved.opaque ||
      /\.(css|json|svg|png|jpg|jpeg|webp|d\.ts)$/.test(resolved.file)
    )
      continue
    const { names: exports, hasDefault } = exportsOf(resolved.file)
    for (const name of names) {
      if (name.startsWith('default:')) {
        if (!hasDefault) {
          problems.push(
            `${path.relative(ROOT, file)}: default import '${name.slice(8)}' but '${spec}' has no default export`,
          )
        }
        continue
      }
      const clean = name.replace(/\s+as\s+.*$/, '').trim()
      if (!clean || clean === 'type' || !/^[A-Za-z0-9_$]+$/.test(clean))
        continue
      if (exports.has('*')) continue
      if (!exports.has(clean)) {
        problems.push(
          `${path.relative(ROOT, file)}: '${clean}' is not exported by '${spec}' (${path.relative(ROOT, resolved.file)})`,
        )
      }
    }
  }
}

if (problems.length) {
  console.log(`FOUND ${problems.length} IMPORT PROBLEMS:\n`)
  for (const p of problems) console.log(' -', p)
  process.exit(1)
} else {
  console.log(`OK — ${files.length} files scanned, all local imports resolve`)
}
