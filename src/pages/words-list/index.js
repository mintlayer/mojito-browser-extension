import React, { useState } from 'react'
import InputsList from '../../commons/components/inputs-list/inputsList'
import './words-list.css'
import Button from '../../commons/components/basic/button'

const WORDS = ['car', 'house', 'cat']

const Words = () => {
  const [fields, setFields] = useState(false)
  return (
    <form className="form" method="POST" data-testid="words-list-form">
      <InputsList
        amount={12}
        wordsList={WORDS}
        fields={fields}
        setFields={setFields}
      />
      <div className="button-wrapper">
        <Button>Save</Button>
      </div>
    </form>
  )
}

export default Words
