import { useContext } from 'react'
import { SkeletonLoader, EmptyListMessage } from '@BasicComponents'
import { VerticalGroup } from '@LayoutComponents'

import Nft from './Nft'
import { MintlayerContext } from '@Contexts'

import styles from './NftList.module.css'

const NftList = () => {
  const { nftData, fetchingNft } = useContext(MintlayerContext)
  const renderSkeletonLoaders = () => (
    <div className={styles.skeletons}>
      {Array.from({ length: 6 }, (_, i) => (
        <SkeletonLoader key={i} />
      ))}
    </div>
  )

  return (
    <VerticalGroup grow>
      {nftData.length === 0 && !fetchingNft && (
        <EmptyListMessage message="No NFTs in this wallet" />
      )}
      {fetchingNft ? (
        renderSkeletonLoaders()
      ) : (
        <ul className={styles.list}>
          {nftData.map((nft) => {
            return (
              <Nft
                key={nft.token_id}
                nft={nft}
              />
            )
          })}
        </ul>
      )}
    </VerticalGroup>
  )
}

export default NftList
