// Mojito onboarding demo — mock data
const BIP39 =
  'abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual adapt add addict address adjust admit adult advance advice aerobic affair afford afraid again age agent agree ahead aim air airport aisle alarm album alcohol alert alien all alley allow almost alone alpha already also alter always amateur amazing among amount amused analyst anchor ancient anger angle angry animal ankle announce annual another answer antenna antique anxiety any apart apology appear apple approve april arch arctic area arena argue arm armed armor army around arrange arrest arrive arrow art artist artwork ask aspect assault asset assist assume asthma athlete atom attack attend attitude attract auction audit august aunt author auto autumn average avocado avoid awake aware away awesome awful awkward axis baby bachelor bacon badge bag balance balcony ball bamboo banana banner bar barely bargain barrel base basic basket battle beach bean beauty because become beef before begin behave behind believe below belt bench benefit best betray better between beyond bicycle bid bike bind biology bird birth bitter black blade blame blanket blast bleak bless blind blood blossom blouse blue blur blush board boat body boil bomb bone bonus book boost border boring borrow boss bottom bounce box boy bracket brain brand brass brave bread breeze brick bridge brief bright bring brisk broken bronze broom brother brown brush bubble buddy budget buffalo build bulb bulk bullet bundle bunker burden burger burst bus business busy butter buyer buzz cabbage cabin cable cactus cage cake call calm camera camp canal cancel candy cannon canoe canvas canyon capable capital captain car carbon card cargo carpet carry cart case cash casino castle casual cat catalog catch category cattle caught cause caution cave ceiling celery cement census century cereal certain chair chalk champion change chaos chapter charge chase chat cheap check cheese chef cherry chest chicken chief child chimney choice choose chronic chuckle chunk churn cigar cinnamon circle citizen city civil claim clap clarify claw clay clean clerk clever click client cliff climb clinic clip clock clog close cloth cloud clown club clump cluster clutch coach coast coconut code coffee coil coin collect color column combine come comfort comic common company concert conduct confirm congress connect consider control convince cook cool copper copy coral core corn correct cost cotton couch country couple course cousin cover coyote crack cradle craft cram crane crash crater crawl crazy cream credit creek crew cricket crime crisp critic crop cross crouch crowd crucial cruel cruise crumble crunch crush cry crystal cube culture cup cupboard curious current curtain curve cushion custom cute cycle'.split(
    ' ',
  )

// 24-word seed shown on the create path (all real BIP39 words)
const ONB_SEED = [
  'ancient',
  'bridge',
  'canyon',
  'anchor',
  'coconut',
  'circle',
  'credit',
  'crystal',
  'autumn',
  'balance',
  'beach',
  'bench',
  'camera',
  'castle',
  'ceiling',
  'century',
  'cherry',
  'clever',
  'cliff',
  'cluster',
  'coral',
  'cotton',
  'crane',
  'brave',
]

// Mock checksum rule for the demo: phrase is "checksum-valid" iff complete,
// every word is BIP39, and the LAST word is one of these.
const ONB_CHECK_WORDS = new Set([
  'brave',
  'coin',
  'claim',
  'beach',
  'army',
  'atom',
  'bonus',
  'circle',
])
const onbChecksumOK = (words) =>
  words.length > 0 &&
  words.every((w) => BIP39.includes(w)) &&
  ONB_CHECK_WORDS.has(words[words.length - 1])

const ONB_DEMO = {
  valid12:
    'autumn balance camera castle cherry clever cliff coral cotton crane crystal coin',
  valid24: ONB_SEED.join(' '),
  badsum24: ONB_SEED.slice(0, 23).join(' ') + ' bridge', // duplicate word, fails mock checksum
}

const ONB_ACCOUNTS = [
  {
    name: 'Account 1',
    path: "m/84'/0'/0'",
    btc: '0.03420000',
    ml: '1,250.00',
    usd: '$2,103.18',
  },
  {
    name: 'Account 2',
    path: "m/84'/0'/1'",
    btc: '0.00180000',
    ml: '86.40',
    usd: '$112.55',
  },
  {
    name: 'Account 3',
    path: "m/84'/0'/2'",
    btc: '0.00000000',
    ml: '12.50',
    usd: '$1.06',
  },
]

const ONB_ADDR = {
  btc: 'bc1q9xw5dg4yr3zarv0c5e2wfjn8kh6mua7ltd0s3j',
  ml: 'mtc1qkrz6c0d8f4h2j9l5n3p7s2v0w6x8z2a4c8e0g',
}

Object.assign(window, {
  BIP39,
  ONB_SEED,
  onbChecksumOK,
  ONB_DEMO,
  ONB_ACCOUNTS,
  ONB_ADDR,
})
