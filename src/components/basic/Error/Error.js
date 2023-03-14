import './Error.css'

const Error = ({ error }) => {
  return (
    <div
      className="errorMessage"
      data-testid="error"
    >
      {Array.isArray(error) ? (
        error.map((message) => (
          <p
            key={message.trim()}
            data-testid="error-message"
          >
            {message}
          </p>
        ))
      ) : (
        <p
          key={error.trim()}
          data-testid="error-message"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export default Error
