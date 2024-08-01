import { useState, useContext, useEffect } from 'react'

import { Button } from '@BasicComponents'
import { ReactComponent as SuccessImg } from '@Assets/images/icon-success.svg'
import { ReactComponent as LoadingImg } from '@Assets/images/icon-loading.svg'

import { MintlayerContext, BitcoinContext } from '@Contexts'

import './UpdateButton.css'

const UpdateButton = () => {
  const { fetchAllData: fetchAllDataMintlayer, fetchDelegations } = useContext(MintlayerContext)
  const { fetchAllData: fetchAllDataBitcoin } = useContext(BitcoinContext)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleClick = async () => {
    try {
      setLoading(true)
      await fetchAllDataBitcoin()
      await fetchAllDataMintlayer()
      await fetchDelegations()
      setLoading(false)
      setShowSuccess(true)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
    return () => clearTimeout(timeout)
  }, [showSuccess])

  return (
    <Button
      onClickHandle={handleClick}
      className="update-button"
      alternate
      extraStyleClasses={['update-button']}
    >
      {loading && (
        <LoadingImg
          className="loading-animated"
          data-testid="icon-loading-animated"
        />
      )}
      {!loading && showSuccess && <SuccessImg data-testid="icon-success" />}
      {!loading && !showSuccess && (
        <LoadingImg data-testid="icon-loading-default" />
      )}
    </Button>
  )
}

export default UpdateButton
