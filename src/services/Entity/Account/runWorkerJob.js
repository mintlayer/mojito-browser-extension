/**
 * Bridge between the app and a crypto WebWorker. Resolves with the worker's
 * response payload, but REJECTS when the response carries an `error` field
 * (the workers' error contract: Cipher.worker.js and BTC.worker.js post
 * `{ error: message }` on failure) or when the worker itself errors — so a
 * failed job can never resolve into undefined data that gets persisted.
 */
const runWorkerJob = (worker, job, data) =>
  new Promise((resolve, reject) => {
    worker.onmessage = ({ data: response }) => {
      worker.terminate()
      if (response?.error) {
        reject(new Error(response.error))
        return
      }
      resolve(response)
    }
    worker.onerror = (event) => {
      worker.terminate()
      reject(new Error(event?.message || 'Worker error'))
    }
    worker.postMessage({ job, data })
  })

export default runWorkerJob
