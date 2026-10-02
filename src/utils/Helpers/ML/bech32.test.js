import { bech32VerifyChecksum } from './bech32'

// Real-world samples: SDK mock address, SDK mock pool/delegation ids.
const VECTORS = [
  ['tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6', ['tmt', 'tmtc']],
  [
    'tpool1dwpe7zy0mhagnwl36ywt5q20xxvu5dwmph4z6q8sc0a3srz5h8jqr0r2yg',
    ['tpool'],
  ],
  [
    'tdelg1d57nmkp24k0rh0fgsjnjy78wxql8wvgr420ncdsesvssvdgfcg6sx6262w',
    ['tdelg'],
  ],
  ['mtc1q96xrfmcnf79nm5ghkxjeeflf0w0cnvnjy72fckq', ['mtc', 'mmtc']],
]

describe('bech32VerifyChecksum (bech32m — Mintlayer encoding)', () => {
  it.each(VECTORS)('accepts a real %s string', (value, hrps) => {
    expect(bech32VerifyChecksum(value, hrps)).toBe(true)
  })

  it('rejects a single-character corruption (the typo vector)', () => {
    const [valid, hrps] = VECTORS[0]
    // flip one data character to a different legal charset character
    const corrupted =
      valid.slice(0, 10) + (valid[10] === 'x' ? 'y' : 'x') + valid.slice(11)
    expect(corrupted).not.toBe(valid)
    expect(bech32VerifyChecksum(corrupted, hrps)).toBe(false)
  })

  it('rejects a swapped-character transposition', () => {
    const [valid, hrps] = VECTORS[0]
    const transposed = valid.slice(0, 8) + valid[9] + valid[8] + valid.slice(10)
    expect(bech32VerifyChecksum(transposed, hrps)).toBe(false)
  })

  it('rejects wrong-network HRPs', () => {
    const [testnetAddr] = VECTORS[0]
    expect(bech32VerifyChecksum(testnetAddr, ['mtc', 'mmtc'])).toBe(false)
  })

  it('rejects mixed case', () => {
    const [valid, hrps] = VECTORS[0]
    expect(
      bech32VerifyChecksum(
        valid.toUpperCase().slice(0, 8) + valid.slice(8),
        hrps,
      ),
    ).toBe(false)
  })

  it('rejects non-charset characters, wrong HRPs, missing separator, short data', () => {
    expect(bech32VerifyChecksum('mtc1qbcl1111h', ['mtc'])).toBe(false) // 'b','l' not in charset... 'b' is
    expect(bech32VerifyChecksum('1qxrwc3gy2', ['tmt'])).toBe(false) // no hrp
    expect(bech32VerifyChecksum('tmt1qp', ['tmt'])).toBe(false) // too short
    expect(bech32VerifyChecksum(undefined, ['tmt'])).toBe(false)
  })

  it('accepts all-uppercase input (BIP-350 allows single-case)', () => {
    // the verifier itself is case-tolerant for all-upper strings; the
    // regex pre-filter in ML.js keeps UIs lowercase — this pins the
    // verifier's own contract
    const [valid, hrps] = VECTORS[0]
    expect(bech32VerifyChecksum(valid.toUpperCase(), hrps)).toBe(true)
  })
})
