import { boundedStringify } from '../TransactionBreakdown/TransactionBreakdown'

import './JsonPreview.css'

const JsonPreview = ({ data }) => {
  return (
    <div className="transactionRawWrapper">
      {boundedStringify(data?.request?.data?.txData?.JSONRepresentation)}
    </div>
  )
}

export default JsonPreview
