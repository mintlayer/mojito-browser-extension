const WORKER_ERROR = '__workerError'

const toWorkerError = (error) => ({ [WORKER_ERROR]: error.message })

const getWorkerError = (data) =>
  typeof data === 'object' && data !== null ? data[WORKER_ERROR] : undefined

const registerWorkerJobs = (jobs) => {
  self.onmessage = async ({ data }) => {
    const name = data?.job

    if (!name || !Object.hasOwn(jobs, name))
      return postMessage(toWorkerError(new Error(`Unknown job: ${name}`)))

    try {
      postMessage(await jobs[name](data.data))
    } catch (error) {
      postMessage(toWorkerError(error))
    }
  }
}

export { WORKER_ERROR, toWorkerError, getWorkerError, registerWorkerJobs }
