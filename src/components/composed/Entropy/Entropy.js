import React from 'react'

import EntropyDescription from './EntropyDescription'

import './Entropy.css'

const DESCRIPTION_ITEMS = [
  'In the blank screen aside please draw anything tou want.',
  'We are going to use this drawing to generate a random seed for your wallet.',
  'The more random the drawing is, the more secure your wallet will be.',
  'Express your art.',
]

const Entropy = () => {
  return (
    <div className="entropy">
      <EntropyDescription descriptionItems={DESCRIPTION_ITEMS} />
    </div>
  )
}

export default Entropy
