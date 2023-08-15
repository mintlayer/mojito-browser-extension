import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useContext,
} from 'react'

import { AccountContext } from '@Contexts'
import { InputInteger } from '@BasicComponents'
import { OptionButtons } from '@ComposedComponents'
import { Electrum } from '@APIs'
import { BTC } from '@Helpers'

import './FeeField.css'

const ML_FEE_MOCK = JSON.stringify({
  1: 30,
  2: 29,
  3: 28,
  4: 27,
  5: 26,
  6: 25,
  7: 24,
  8: 23,
  9: 22,
  10: 21,
  11: 20,
  12: 19,
  13: 18,
  14: 17,
  15: 16,
  16: 15,
})

const FeeField = ({
  value: parentValue,
  id,
  changeValueHandle,
  setFeeValidity,
}) => {
  const { walletType } = useContext(AccountContext)
  const effectCalled = useRef(false)
  const [options, setOptions] = useState([])
  const [inputValue, setInputValue] = useState(0)
  const [radioButtonValue, setButtonValue] = useState(undefined)
  const [timeToFirstConfirmations, setTimeToFirstConfirmations] =
    useState('15 minutes')
  const [estimatedFees, setEstimatedFees] = useState([])
  const feeType = walletType.name === 'Mintlayer' ? 'ML' : 'sat/B'

  const blocksToConfirm = useCallback(
    (value) => {
      const seletedEstimate = Object.entries(estimatedFees).find(
        ([_, fee]) => fee <= Number(value),
      )
      return seletedEstimate ? seletedEstimate[0] : Number.POSITIVE_INFINITY
    },
    [estimatedFees],
  )

  const changeInputValue = useCallback(
    (value) => {
      if (value === '' || !Number(value)) {
        setFeeValidity(false)
        setInputValue(0)
        setTimeToFirstConfirmations('∞')
        return
      }

      setFeeValidity(Number(value) && value.toString())

      const blocksAmount = blocksToConfirm(value)
      const minutesTo1stConfirmation = blocksAmount
        ? blocksAmount * BTC.AVERAGE_MIN_PER_BLOCK
        : blocksAmount
      const timeTo1stConfirmation =
        minutesTo1stConfirmation <= 60
          ? `${minutesTo1stConfirmation} minutes`
          : `${
              Number.isFinite(minutesTo1stConfirmation)
                ? Math.ceil(minutesTo1stConfirmation / 60)
                : '∞'
            } hours`

      setInputValue(Math.ceil(value))
      setTimeToFirstConfirmations(`${timeTo1stConfirmation}`)
    },
    [blocksToConfirm, setFeeValidity],
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
      const btcFees = await Electrum.getFeesEstimates()
      const mlFees = ML_FEE_MOCK
      const fees = walletType.name === 'Mintlayer' ? mlFees : btcFees
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
  }, [walletType.name])

  useEffect(() => {
    if (Number(parentValue)) {
      changeInputValue(parentValue)
      return
    }

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
        <div className="fee-input-wrapper">
          <InputInteger
            id={id}
            value={inputValue}
            onChangeHandle={inputChangeHandler}
          />
          <small>{feeType}</small>
        </div>
        <OptionButtons
          value={radioButtonValue}
          options={options}
          onSelect={optionSelectHandle}
        />
      </div>
      <p>Estimated time for 1st confirmation: {timeToFirstConfirmations}</p>
    </div>
  )
}

export default FeeField
