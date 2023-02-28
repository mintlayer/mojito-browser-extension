import React from 'react'

import EntropyDescription from './EntropyDescription'
import DrawingBoard from './DrawingBoard'
import { Error } from '@BasicComponents'

import './Entropy.css'

const DESCRIPTION_ITEMS = [
  'In the blank screen aside please draw anything you want.',
  'We are going to use this drawing to generate a random seed for your wallet.',
  'The more random the drawing is, the more secure your wallet will be.',
  'Express your art.',
]

const errorMessages = 'Your entropy is too small. Please draw more lines.'

const Entropy = ({ isError }) => {
  return (
    <>
      <div
        className="entropy"
        data-testid="entropy"
      >
        <EntropyDescription descriptionItems={DESCRIPTION_ITEMS} />
        <DrawingBoard />
      </div>
      {isError && <Error error={errorMessages} />}
    </>
  )
}

export default Entropy
