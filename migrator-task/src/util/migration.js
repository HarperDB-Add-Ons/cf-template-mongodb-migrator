import { eachOfSeries } from 'async'

import jobConfig from './config.js'
import sendEvent from './send-event.js'
import transformConfig from './transform-config.js'
import handleDatabase from './handle-database.js'
import logger from './logger.js'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export default async (client, job) => {
  await sendEvent({ type: 'job_start', pid: process.pid })
  let initialCount = true

  // Run this task forever
  while (true) {
    // Transform the job configuration into something we can use for fetching
    const config = transformConfig(job.configuration)

    // Loop through each database in this job and sync it's collections
    await eachOfSeries(config, async (collectionNames, databaseName) => {
      try {
        await handleDatabase(client, databaseName, collectionNames, initialCount)
      } catch (e) {
        await sendEvent({ type: 'error', message: `${e.name}: ${e.message}`, stack: e.stack })
        logger.error(`Unable to sync Database ${databaseName}: ${e.toString()}`)
      }
    })

    // If we are just counting the rows, don't sleep afterwards
    if (!initialCount) {
      // Sleep for our pre-determined amount of time before re-scanning and starting over
      const sleepTimer = jobConfig.sleepTimeMs || 30000
      logger.info(`Sleeping for ${sleepTimer / 1000}s before re-scanning.`)
      await sleep(sleepTimer)
    }

    // Set back to false so we start migrating next loop
    initialCount = false
  }
}
