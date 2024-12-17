import { useContext } from 'react'
import { SkeletonLoader, EmptyListMessage } from '@BasicComponents'
import { VerticalGroup } from '@LayoutComponents'

import Nft from './Nft'
import { MintlayerContext } from '@Contexts'

import styles from './NftList.module.css'

const NftList = () => {
  const { nftUtxos, fetchingNft } = useContext(MintlayerContext)
  const renderSkeletonLoaders = () => (
    <div>
      {Array.from({ length: 6 }, (_, i) => (
        <SkeletonLoader key={i} />
      ))}
    </div>
  )

  return (
    <VerticalGroup
      bigGap
      grow
    >
      <h1 className={styles.title}>Your current Nft</h1>
      {nftUtxos.length === 0 && !fetchingNft && (
        <EmptyListMessage message="No NFT in this wallet" />
      )}
      {fetchingNft ? (
        renderSkeletonLoaders()
      ) : (
        <ul className={styles.list}>
          {nftUtxos.map((nftTransaction, index) => {
            return (
              <Nft
                key={index}
                nft={nftTransaction.utxo}
              />
            )
          })}
        </ul>
      )}
    </VerticalGroup>
  )
}

export default NftList
