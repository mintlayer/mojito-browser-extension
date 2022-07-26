import { map as BBMap } from 'bluebird'

const map = async (list, asyncFn) =>
  await BBMap(list, asyncFn, { concurrency: 2 })

export { map }
