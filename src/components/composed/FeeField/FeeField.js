import React, { useCallback, useEffect, useRef, useState } from 'react'

import { InputInteger } from '@BasicComponents'
import { RadioButtons } from '@ComposedComponents'
import { Electrum } from '@APIs'
import { BTC } from '@Helpers'

import './FeeField.css'

const FeeField = ({ value: parentValue, id, changeValueHandle }) => {
  const effectCalled = useRef(false)
  const [options, setOptions] = useState([])
  const [inputValue, setInputValue] = useState()
  const [radioButtonValue, setButtonValue] = useState(undefined)
  const [timeToFirstConfirmations, setTimeToFirstConfirmations] =
    useState('15 minutes')
  const [estimatedFees, setEstimatedFees] = useState([])

  const blocksToConfirm = useCallback(
    (value) =>
      Object.entries(estimatedFees).find(([_, fee]) => fee <= Number(value))[0],
    [estimatedFees],
  )

  const changeInputValue = useCallback(
    (value) => {
      if (!value) {
        setInputValue(0)
        setTimeToFirstConfirmations('---')
        return
      }

      const blocksAmount = blocksToConfirm(value)
      const minutesTo1stConfirmation = blocksAmount * BTC.AVERAGE_MIN_PER_BLOCK
      const timeTo1stConfirmation =
        minutesTo1stConfirmation <= 60
          ? `${minutesTo1stConfirmation} minutes`
          : `${Math.ceil(minutesTo1stConfirmation / 60)} hours`

      setInputValue(value)
      setTimeToFirstConfirmations(`${timeTo1stConfirmation}`)
    },
    [blocksToConfirm],
  )

  const inputChangeHandler = ({ target: { value } }) => changeInputValue(value)

  const optionSelectHandle = (selectedOption) => {
    if (!selectedOption) return
    changeInputValue(selectedOption.value)
  }

  useEffect(() => {
    if (effectCalled.current) return
    effectCalled.current = true

    const populateOptions = async () => {
      const fees = await Electrum.getFeesEstimates()
      const estimates = JSON.parse(fees)
      setEstimatedFees(estimates)

      const parsedFees = BTC.parseFeesEstimates(estimates)

      setOptions([
        { name: 'low', value: parsedFees.LOW },
        { name: 'norm', value: parsedFees.MEDIUM },
        { name: 'high', value: parsedFees.HIGH },
      ])
    }

    populateOptions()
  }, [])

  useEffect(() => {
    if (Number(parentValue)) {
      changeInputValue(parentValue)
      return
    }
    console.log(parentValue)
    const optionSelected = options.find((item) => item.name === parentValue)

    setButtonValue(parentValue)
    optionSelected
      ? changeInputValue(optionSelected.value)
      : changeInputValue(0)
  }, [parentValue, options, changeInputValue])

  useEffect(() => {
    changeValueHandle(inputValue)
  }, [inputValue, changeValueHandle])

  return (
    <div className="fee-field-wrapper">
      <div className="fee-field">
        <InputInteger
          id={id}
          value={inputValue}
          onChangeHandle={inputChangeHandler}
        />
        <small>sat/B</small>
        <RadioButtons
          value={radioButtonValue}
          options={options}
          onSelect={optionSelectHandle}
        />
      </div>
      <p>Estimate time for 1st confirmation: {timeToFirstConfirmations}</p>
    </div>
  )
}

export default FeeField
