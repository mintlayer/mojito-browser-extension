import { useState } from 'react'

import { PopUp } from '@ComposedComponents'
import NftDetails from './NftDetails'
import { useNavigate } from 'react-router-dom'
import styles from './Nft.module.css'

const NftItem = ({ nft }) => {
  const navigate = useNavigate()
  const [detailPopupOpen, setDetailPopupOpen] = useState(false)
  const name = nft?.data?.name?.string || 'NFT'
  const getImageLink = () => {
    const rawImageLink = nft?.data?.icon_uri?.string || 'NFT'
    if (rawImageLink.startsWith('ipfs://')) {
      return rawImageLink.replace('ipfs://', 'https://gateway.ipfs.io/ipfs/')
    }
    return rawImageLink
  }

  const handleSend = () => {
    navigate('/wallet/mintlayer/nft/' + nft.token_id + '/send')
  }

  return (
    <li
      className={styles.transaction}
      data-testid="transaction"
      onClick={() => setDetailPopupOpen(true)}
    >
      <div
        className={styles.transactionLogoType}
        data-testid="transaction-icon"
      >
        <img
          src={getImageLink()}
          alt="NFT"
        />
      </div>
      <div className={styles.transactionDetail}>
        <p
          className={styles.transactionId}
          data-testid="transaction-otherPart"
        >
          {name}
        </p>
        <div className={styles.transactionDateAmount}>
          <p
            className={styles.transactionDate}
            data-testid="transaction-date"
          >
            {nft?.data?.description?.string}
          </p>
          <p
            className={styles.transactionAmount}
            data-testid="transaction-amount"
          >
            Tiker: <span>{nft?.data?.ticker.string}</span>
          </p>
        </div>
      </div>
      {detailPopupOpen && (
        <PopUp setOpen={setDetailPopupOpen}>
          <NftDetails
            nft={nft}
            handleSend={handleSend}
          />
        </PopUp>
      )}
    </li>
  )
}

export default NftItem
