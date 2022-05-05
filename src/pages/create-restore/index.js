import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import LineChart from '../../commons/components/charts/lineChart'
import ArcChart from '../../commons/components/charts/arcChart'

const generateLineData = () => (
  [...Array(50)]
    .map((_, index) => (
      [ index * 3, Math.random() * 100 ]
    ))
)

const ArcData = [
  { value: 10, asset: 'BTC', color: 'orange'},
  { value: 40, asset: 'MLT', color: 'blue'},
  { value: 20, asset: 'ETH', color: 'red'}
]

const CreateRestore = () => {
  const [points, setPoints] = useState()
  const [arcRegions, setArcRegions] = useState()

  useEffect(() => {
    setPoints(generateLineData())
    setArcRegions(ArcData)
  }, [])

  return (
    <div data-testid="create-restore">
      <h1 className="center-text">Create or Restore Account</h1>
      <Link to="/set-account-name">Create an account</Link>
      <LineChart width="200px" points={points}/>
      <ArcChart data={arcRegions}/>
    </div>
  )
}

export default CreateRestore
