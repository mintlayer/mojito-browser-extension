const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '../../')
const mojitoPath = path.join(rootDir, 'build/mojito.js')
const pkgPath = path.join(rootDir, 'package.json')

const pkg = require(pkgPath)

let content = fs.readFileSync(mojitoPath, 'utf8')
content = content.replace('__APP_VERSION__', pkg.version)
fs.writeFileSync(mojitoPath, content)
console.log('Injected version', pkg.version, 'into mojito.js')
