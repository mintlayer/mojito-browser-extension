const path = require('path')
const fs = require('fs')

const rootDir = path.resolve(__dirname, '../../')
const manifestChromePath = path.join(rootDir, 'public/manifestDefault.json')
const manifestFirefoxPath = path.join(rootDir, 'public/manifestFirefox.json')
const pkgPath = path.join(rootDir, 'package.json')

const manifestChrome = require(manifestChromePath)
const manifestFirefox = require(manifestFirefoxPath)
const pkg = require(pkgPath)

manifestChrome.version = pkg.version
manifestFirefox.version = pkg.version

fs.writeFileSync(manifestChromePath, JSON.stringify(manifestChrome, null, 2))
fs.writeFileSync(manifestFirefoxPath, JSON.stringify(manifestFirefox, null, 2))
