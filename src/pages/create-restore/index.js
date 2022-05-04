import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import LineChart from '../../commons/components/charts/lineChart'

const generateData = () => (
  [...Array(50)]
    .map((_, index) => (
      [ index * 3, Math.random() * 100 ]
    ))
)

const CreateRestore = () => {
  const [points, setPoints] = useState()

  useEffect(() => {
    setPoints(generateData())
  }, [])

  return (
    <div data-testid="create-restore">
      <h1 className="center-text">Create or Restore Account</h1>
      <Link to="/set-account-name">Create an account</Link>
      <LineChart width="400px" points={points}/>
    </div>
  )
}

export default CreateRestore
