import { Header } from '@ComposedComponents'
import { SendTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'

import './SendTransaction.css'

const SendTransactionPage = () => {
  return (
    <>
      <Header />
      <div className="page">
        <VerticalGroup>
          <SendTransaction />
        </VerticalGroup>
      </div>
    </>
  )
}

export default SendTransactionPage
