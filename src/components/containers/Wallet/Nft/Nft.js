import { useState } from 'react'
import { PopUp } from '@ComposedComponents'
import NftDetails from './NftDetails'
import useNftImage from './useNftImage'
import { useNavigate } from 'react-router'
import styles from './Nft.module.css'

const NftItem = ({ nft }) => {
  const navigate = useNavigate()
  const [detailPopupOpen, setDetailPopupOpen] = useState(false)

  const name = nft?.data?.name?.string || 'NFT'
  const ticker = nft?.data?.ticker?.string || 'N/A'
  const imageSrc = useNftImage(
    nft?.data?.icon_uri?.string || nft?.data?.media_uri?.string,
  )

  const handleSend = () => {
    navigate('/wallet/Mintlayer/nft/' + nft.token_id + '/send')
  }

  return (
    <li
      className={styles.tile}
      data-testid="nft-tile"
      onClick={() => setDetailPopupOpen(true)}
    >
      <div
        className={styles.tileImage}
        data-testid="nft-image"
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={name}
            loading="lazy"
          />
        ) : (
          <span className={styles.tileFallback}>{name.charAt(0)}</span>
        )}
      </div>
      <div className={styles.tileCaption}>
        <span
          className={styles.tileName}
          data-testid="nft-name"
        >
          {name}
        </span>
        <span
          className={styles.tileTicker}
          data-testid="nft-ticker"
        >
          {ticker}
        </span>
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
