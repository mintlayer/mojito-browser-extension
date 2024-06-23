import { useState, useContext, useEffect } from 'react'

import { Button } from '@BasicComponents'
import { ReactComponent as SuccessImg } from '@Assets/images/icon-success.svg'
import { ReactComponent as LoadingImg } from '@Assets/images/icon-loading.svg'

import { NetworkContext } from '@Contexts'

import './UpdateButton.css'


const UpdateButton = () => {
  const { fetchAllData, fetchDelegations } =
    useContext(NetworkContext)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleClick = async () => {
    try {
      setLoading(true)
      await fetchAllData()
      await fetchDelegations()
      setLoading(false)
      setShowSuccess(true)
    }
    catch (error) {
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
      {loading && <LoadingImg className="loading-animated" />}
      {!loading && showSuccess && <SuccessImg />}
      {!loading && !showSuccess && <LoadingImg />}
    </Button>
  )
}

export default UpdateButton
