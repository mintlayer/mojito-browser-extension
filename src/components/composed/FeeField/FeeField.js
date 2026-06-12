import React, { useCallback, useEffect, useRef, useState } from 'react'

import { Electrum } from '@APIs'
import { BTC } from '@Helpers'

import styles from './FeeField.module.css'

const TIERS = [
  { key: 'low', label: 'Slow' },
  { key: 'norm', label: 'Medium' },
  { key: 'high', label: 'Fast' },
]

const formatTime = (minutes) => {
  if (!Number.isFinite(minutes) || minutes <= 0) return '~∞'
  if (minutes <= 60) return `~${minutes} min`
  return `~${Math.ceil(minutes / 60)} hr`
}

const FeeField = ({
  value: parentValue,
  id,
  changeValueHandle,
  setFeeValidity,
}) => {
  const effectCalled = useRef(false)
  const [options, setOptions] = useState([])
  const [estimatedFees, setEstimatedFees] = useState({})
  const [selectedKey, setSelectedKey] = useState('norm')
  const [inputValue, setInputValue] = useState(0)

  const blocksToConfirm = useCallback(
    (value) => {
      const selected = Object.entries(estimatedFees).find(
        (entry) => entry[1] <= Number(value),
      )
      return selected ? Number(selected[0]) : Number.POSITIVE_INFINITY
    },
    [estimatedFees],
  )

  const changeInputValue = useCallback(
    (value) => {
      if (value === '' || !Number(value)) {
        setFeeValidity(false)
        setInputValue(0)
        return
      }

      setFeeValidity(Number(value) && value.toString())
      setInputValue(Math.ceil(value))
    },
    [setFeeValidity],
  )

  useEffect(() => {
    if (effectCalled.current) return
    effectCalled.current = true

    const populateOptions = async () => {
      const btcFees = await Electrum.getFeesEstimates()
      const estimates = JSON.parse(btcFees)
      setEstimatedFees(estimates)
      const parsedFees = BTC.parseFeesEstimates(estimates)

      setOptions([
        { key: 'low', value: parsedFees.LOW },
        { key: 'norm', value: parsedFees.MEDIUM },
        { key: 'high', value: parsedFees.HIGH },
      ])
    }

    populateOptions()
  }, [])

  const parentValueRef = useRef(parentValue)
  parentValueRef.current = parentValue

  useEffect(() => {
    const pv = parentValueRef.current
    if (Number(pv)) {
      changeInputValue(pv)
      return
    }

    const optionSelected = options.find((item) => item.key === pv)
    if (pv) setSelectedKey(pv)
    optionSelected
      ? changeInputValue(optionSelected.value)
      : changeInputValue(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options])

  useEffect(() => {
    changeValueHandle(inputValue)
  }, [inputValue, changeValueHandle])

  const handleSelect = (tier) => {
    setSelectedKey(tier.key)
    const option = options.find((o) => o.key === tier.key)
    if (option) changeInputValue(option.value)
  }

  return (
    <div
      className={styles.tiers}
      id={id}
    >
      {TIERS.map((tier) => {
        const option = options.find((o) => o.key === tier.key)
        const isSelected = selectedKey === tier.key
        const blocks = option ? blocksToConfirm(option.value) : null
        const time =
          blocks != null
            ? formatTime(blocks * BTC.AVERAGE_MIN_PER_BLOCK)
            : '...'
        return (
          <button
            key={tier.key}
            type="button"
            className={`${styles.tierCard} ${isSelected ? styles.tierCardSelected : ''}`}
            onClick={() => handleSelect(tier)}
          >
            <span
              className={`${styles.tierLabel} ${isSelected ? styles.tierLabelSelected : ''}`}
            >
              {tier.label}
            </span>
            <span className={styles.tierTime}>{time}</span>
            <span className={styles.tierFee}>
              {option ? `${option.value} sat/B` : '...'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default FeeField
