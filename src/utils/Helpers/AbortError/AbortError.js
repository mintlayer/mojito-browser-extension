/**
 * True when an error is a request-abort (the AbortError DOMException).
 *
 * Aborts are a control-flow mechanism in this codebase: switching networks
 * or superseding a refresh cancels in-flight requests by design. They must
 * never be surfaced as API failures or outages.
 */
const isAbortError = (error) => error?.name === 'AbortError'

export { isAbortError }
