import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LineChart from '../../commons/components/charts/lineChart'
import ArcChart from '../../commons/components/charts/arcChart'
import Button from '../../commons/components/basic/button'
import VerticalGroup from '../../commons/components/group/verticalGroup'
import CenteredLayout from '../../commons/components/group/centeredLayout'

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
  const navigate = useNavigate()

  useEffect(() => {
    setPoints(generateLineData())
    setArcRegions(ArcData)
  }, [])

  const goToSetAccountNamePage = () => navigate('/set-account-name')

  return (
    <div data-testid="create-restore">
      <h1 className="center-text">Create or Restore Account</h1>

      <CenteredLayout>
        <VerticalGroup>
          <Button
            onClickHandle={goToSetAccountNamePage}>Create</Button>
          <Button alternate>Restore</Button>
        </VerticalGroup>
      </CenteredLayout>
      <LineChart width="200px" points={points}/>
      <ArcChart data={arcRegions}/>
    </div>
  )
}

export default CreateRestore
