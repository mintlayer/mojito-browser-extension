import { Wallet } from '@ContainerComponents'
import styles from './Nft.module.css'

const NftPage = () => {
  return (
    <div className={styles.nftPage}>
      <Wallet.NftList />
    </div>
  )
}

export default NftPage
