import { eachSeries } from 'async'

import handleCollection from './handle-collection.js'
import logger from './logger.js'
import sendEvent from './send-event.js'

export default async (client, databaseName, collectionNames, initialCount = false) => {
  const db = client.db(databaseName)

  // Sync each collection
  await eachSeries(collectionNames, async (collectionName) => {
    try {
      await handleCollection(db, databaseName, collectionName, initialCount)
    } catch (e) {
      await sendEvent({ type: 'error', message: `${e.name}: ${e.message}`, stack: e.stack })
      logger.error(`Collection sync error: ${e}`)
    }
  })
}
