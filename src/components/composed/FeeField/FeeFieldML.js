import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useContext,
} from 'react'

import { AccountContext, NetworkContext } from '@Contexts'
import { InputInteger } from '@BasicComponents'
import { OptionButtons } from '@ComposedComponents'
import { BTC } from '@Helpers'

import './FeeField.css'

const FeeFieldML = ({
  value: parentValue,
  id,
  changeValueHandle,
  setFeeValidity,
}) => {
  const { walletType } = useContext(AccountContext)
  const { feerate } = useContext(NetworkContext)
  const effectCalled = useRef(false)
  const [options, setOptions] = useState([])
  const [inputValue, setInputValue] = useState(0)
  const [radioButtonValue, setButtonValue] = useState(undefined)
  const [timeToFirstConfirmations, setTimeToFirstConfirmations] =
    useState('~2 minutes')
  const [estimatedFees, setEstimatedFees] = useState([])
  const feeType = 'atoms/kB'

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
      const btcFees = feerate
      const fees = btcFees
      const estimates = JSON.parse(fees)
      setEstimatedFees(estimates)

      const parsedFees = {
        LOW: Math.ceil(feerate),
        MEDIUM: Math.ceil(feerate),
        HIGH: Math.ceil(feerate),
      }

      setOptions([
        // { name: 'low', value: parsedFees.LOW },
        { name: 'norm', value: parsedFees.MEDIUM },
        // { name: 'high', value: parsedFees.HIGH },
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
        <div className="fee-input-wrapper ml">
          <InputInteger
            id={id}
            value={inputValue}
            onChangeHandle={inputChangeHandler}
            disabled={true}
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

export default FeeFieldML
