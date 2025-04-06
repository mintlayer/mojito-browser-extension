export const TransactionPreview = ({data}) => {
  return (
    <div>
      {JSON.stringify(data, null, 2)}
    </div>
  )
}
