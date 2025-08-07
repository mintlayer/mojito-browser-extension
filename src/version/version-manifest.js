const path = require('path')
const fs = require('fs')
// const prettier = require('prettier')

const rootDir = path.resolve(__dirname, '../../')
// const manifestBuildPath = path.join(rootDir, 'build/manifest.json')
const manifestChromePath = path.join(rootDir, 'public/manifestDefault.json')
const manifestFirefoxPath = path.join(rootDir, 'public/manifestFirefox.json')
const pkgPath = path.join(rootDir, 'package.json')

console.log('Updating version in manifest files...')

const manifestChrome = require(manifestChromePath)
const manifestFirefox = require(manifestFirefoxPath)
// const manifestBuild = require(manifestBuildPath)
const pkg = require(pkgPath)

manifestChrome.version = pkg.version
manifestFirefox.version = pkg.version
// manifestBuild.version = pkg.version

fs.writeFileSync(manifestChromePath, JSON.stringify(manifestChrome, null, 2))
fs.writeFileSync(manifestFirefoxPath, JSON.stringify(manifestFirefox, null, 2))
// fs.writeFileSync(manifestBuildPath, JSON.stringify(manifestBuild, null, 2))
