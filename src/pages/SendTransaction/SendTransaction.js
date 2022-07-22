import { Header } from '@ComposedComponents'
import { SendTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'

const SendTransactionPage = () => {
  return (
    <>
      <Header />
      <VerticalGroup>
        <h3>Send Funds</h3>
        <SendTransaction />
      </VerticalGroup>
    </>
  )
}

export default SendTransactionPage
