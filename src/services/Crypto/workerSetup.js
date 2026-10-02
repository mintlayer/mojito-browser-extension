// Web workers go through a separate bundling pipeline that receives none of
// the app bundle's global polyfills (rolldown-vite ignores worker.plugins),
// so the node globals the crypto stack expects (bip39/bip32 use bare
// `Buffer`) must be installed at the top of every worker entry, before any
// other import.
import { Buffer } from 'buffer'
import process from 'process'

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer
}
if (typeof globalThis.process === 'undefined') {
  globalThis.process = process
}
