import { CenteredLayout } from '@LayoutComponents'
import { OptionButtons } from '@ComposedComponents'

import './WalletList.css'

const WalletList = ({ selectedWallet, setSelectedWallet, walletTypes }) => {
  const radioButtonExtraClasses = ['crate-wallet-button']
  return (
    <CenteredLayout>
      <p
        className="wallet-list-description"
        data-testid="wallet-list-description"
      >
        Whitch of this wallet would you ask to add
      </p>
      <OptionButtons
        value={selectedWallet}
        onSelect={setSelectedWallet}
        options={walletTypes}
        buttonExtraStyles={radioButtonExtraClasses}
        column
        multiple
      />
    </CenteredLayout>
  )
}

export default WalletList
