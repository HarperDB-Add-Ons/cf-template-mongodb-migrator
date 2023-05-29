import logger from './logger.js'
import sendChunk from './send-chunk.js'

export default async (chunk, databaseName, collectionName) => {
  const request = await sendChunk(chunk, databaseName, collectionName)
  if (request.response.status !== 200 || !request.body.success) {
    logger.info(`[${databaseName}.${collectionName}] Unable to sync chunk to HarperDB: ${request.body.message || request.body.error}`)
  }
  logger.info(`[${databaseName}.${collectionName}] Chunk saved: ${request.body.message}`)
  return true
}
