import { ObjectId } from 'mongodb'

import handleChunk from './handle-chunk.js'
import logger from './logger.js'
import sendEvent from './send-event.js'
import config from './config.js'
import getLastDocument from './get-last-document.js'

export default async (db, databaseName, collectionName, initialCount = false) => {
  const collection = db.collection(collectionName)

  // Grab the latest objectId from the API
  let lastObjectId = null
  try {
    const response = await getLastDocument(databaseName, collectionName)
    lastObjectId = response.lastId
  } catch (e) {
    await sendEvent({ type: 'error', message: `${e.name}: ${e.message}`, stack: e.stack })
    logger.error(`[${databaseName}.${collectionName}] Unable to fetch latest ID: ${e.toString()}`)
    const failOnHistory = process.env.FAIL_ON_HISTORY_ERROR || config.failOnHistoryErrorDefault
    if (failOnHistory === 'true') {
      logger.error(`[${databaseName}.${collectionName}] Failing on history load error!`)
      process.exit(1)
    }
  }

  // If we have a last objectId, set the query and execute the find
  let query = {}
  if (lastObjectId) {
    query = { _id: { $gt: new ObjectId(lastObjectId) } }
  }
  const cursor = collection.find(query, { sort: { _id: 1 } })

  // Count the amount of documents available
  const totalCount = await collection.countDocuments()
  const remainingCount = await collection.countDocuments(query)
  await sendEvent({
    type: 'source_count',
    databaseName,
    collectionName,
    totalCount,
    remainingCount
  })
  logger.info(`[${databaseName}.${collectionName}] Total Documents: ${totalCount}; Remaining to transfer: ${remainingCount}`)

  // If this is just the initial count, don't start migrating just yet
  if (initialCount) {
    logger.info(`[${databaseName}.${collectionName}] Skipping migration to complete initial count.`)
    return
  }

  // Asynchronously grab each row until we are at our chunk limit
  let chunk = []
  for await (const doc of cursor) {
    chunk.push(doc)

    // If we have hit our chunk size, or we have run out of documents, send the chunk
    const hasNext = await cursor.hasNext()
    if (chunk.length === config.batchSize || !hasNext) {
      let response
      try {
        response = await handleChunk(chunk, databaseName, collectionName)
      } catch (e) {
        logger.error(`[${databaseName}.${collectionName}] Unable to submit chunk: ${e}`)
        await sendEvent({ type: 'error', message: `${e.name}: ${e.message}`, stack: e.stack })
      }

      // If the chunk succeeded, log the event
      if (response) {
        await sendEvent({
          type: 'transfer',
          databaseName,
          collectionName,
          rowCount: chunk.length
        })
      }

      // Reset chunk back to zero documents
      chunk = []
    }
  }

  logger.info(`[${databaseName}.${collectionName}] All files for this collection have been transferred!`)
}
