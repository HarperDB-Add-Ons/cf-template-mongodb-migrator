import { resolve } from 'path'
import { readFile } from 'fs/promises'

export default async (jobId, hdbCore, logger) => {
  const configuration = await hdbCore.requestWithoutAuthentication({
    body: { operation: 'get_configuration' }
  })

  let date = new Date()
  date = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .substring(0, 10)

  const logPath = resolve(configuration.HDB_ROOT, 'log/mongo-migrator')

  let contents
  try {
    contents = await readFile(
      resolve(
        logPath,
        `combined-${jobId.substring(24)}.log.${date}`
      ),
      'utf-8'
    )
  } catch (e) {
    logger.notify(`Unable to load logs: ${e.toString()}`)
  }

  return contents.split('\n')
    .map(line => {
      try {
        line = JSON.parse(line)
      } catch (_) {
        return null
      }
      return `[${line.timestamp}] [${line.level}] ${line.message}`
    })
    .filter(v => !!v)
    .reverse()
    .slice(0, 1000)
}
