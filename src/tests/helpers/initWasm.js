import fs from 'fs'
import path from 'path'
import { initSync } from 'src/services/Crypto/Mintlayer/@mintlayerlib-js/wasm_wrappers.js'

const WASM_PATH = path.resolve(
  process.cwd(),
  'src/services/Crypto/Mintlayer/@mintlayerlib-js/wasm_wrappers_bg.wasm',
)

let compiled

const initWasm = () => {
  if (!compiled) compiled = new WebAssembly.Module(fs.readFileSync(WASM_PATH))
  initSync({ module: compiled })
}

export default initWasm
