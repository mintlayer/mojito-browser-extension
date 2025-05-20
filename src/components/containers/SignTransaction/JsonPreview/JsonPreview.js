import './JsonPreview.css'

const JsonPreview = ({ data }) => {
  return (
    <div className="transactionRawWrapper">
      {JSON.stringify(data?.request?.data?.txData?.JSONRepresentation, null, 2)}
    </div>
  )
}

export default JsonPreview
