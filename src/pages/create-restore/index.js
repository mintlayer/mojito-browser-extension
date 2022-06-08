import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../commons/components/basic/button'
import VerticalGroup from '../../commons/components/group/verticalGroup'
import CenteredLayout from '../../commons/components/group/centeredLayout'
import { getLastBlockHash } from '../../commons/api/electrum'
import { generateAddr } from '../../commons/crypto/btc'

const CreateRestore = () => {
  const navigate = useNavigate()

  const goToSetAccountPage = () => navigate('/set-account')

  useEffect(()=>{
    const fetchData = async () => {
      const data = await getLastBlockHash()
      console.log(data)
      const addr = await generateAddr()
      console.log(addr)
    }
    fetchData()
  }, [])

  return (
    <div data-testid="create-restore">
      <h1 className="center-text title-create">
        Your Bitcoin wallet right in your browser
      </h1>
      <CenteredLayout>
        <VerticalGroup>
          <Button onClickHandle={goToSetAccountPage}>Create</Button>
          <Button alternate>Restore</Button>
        </VerticalGroup>
      </CenteredLayout>
      <div className="footnote-wrapper">
        <small
          className="center-text footnote-name"
          data-testid="footnote-name"
        >
          ©Mojito Wallet, 2022
        </small>
        <a
          className="center-text footnote-link"
          href="http://mojito-wallet.com"
          target="_blank"
          data-testid="footnote-link"
        >
          mojito-wallet.com
        </a>
      </div>
    </div>
  )
}

export default CreateRestore
