import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { OptionButtons } from '@ComposedComponents'

import './WalletList.css'

// This componetn currently not used in the app, but it is kept for future use
const WalletList = ({ selectedWallets, setSelectedWallets, walletTypes }) => {
  const radioButtonExtraClasses = ['crate-wallet-button']
  return (
    <CenteredLayout>
      <VerticalGroup smallGap>
        <p
          className="wallet-list-description"
          data-testid="wallet-list-description"
        >
          Which of these wallets would you like to add?
        </p>
        <OptionButtons
          value={selectedWallets}
          onSelect={setSelectedWallets}
          options={walletTypes}
          buttonExtraStyles={radioButtonExtraClasses}
          column
          multiple
        />
      </VerticalGroup>
    </CenteredLayout>
  )
}

export default WalletList
