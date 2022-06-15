import React, { useState, useEffect } from 'react'
import InputsList from '../../commons/components/inputs-list/inputsList'
import Header from '../../commons/components/advanced/header'
import Button from '../../commons/components/basic/button'
import CenteredLayout from '../../commons/components/group/centeredLayout'
import VerticalGroup from '../../commons/components/group/verticalGroup'

import './restoreAccount.css'

const RestoreAccountPage = () => {
  const [fields, setFields] = useState([])
  const [valid, setValid] = useState(1)
  const WORDS = ['car', 'house', 'cat']

  useEffect(() => {
    const validity = fields.every((word) => word.validity)
    setValid(validity)
  }, [fields])

  const handleSubmit = (e) => {
    e.preventDefault()
    valid
      ? console.log('Account restored')
      : console.log('Something went wrong')
  }

  return (
    <>
      <Header />
      <form
        className="restore-account-form"
        method="POST"
        data-testid="restore-account-form"
        onSubmit={handleSubmit}
      >
        <VerticalGroup>
          <InputsList
            wordsList={WORDS}
            fields={fields}
            setFields={setFields}
            amount={12}
            restoreMode
          />
          <CenteredLayout>
            <Button
              type="submit"
              onClickHandle={handleSubmit}
            >
              Restore
            </Button>
          </CenteredLayout>
        </VerticalGroup>
      </form>
    </>
  )
}
export default RestoreAccountPage
