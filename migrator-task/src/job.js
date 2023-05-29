import { MongoClient } from 'mongodb'

import configureShutdown from './util/configure-shutdown.js'
import migrationAction from './util/migration.js'
import logger from './util/logger.js'
import getJob from './util/get-job.js'
import sendEvent from './util/send-event.js'

// Create the MongoDB Client driver
const client = new MongoClient(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
configureShutdown(client)

const main = async () => {
  logger.info(`Mongo Migrator started! (Job ${process.env.JOB_ID})`)

  logger.info('Attempting connection to the MongoDB URI provided')
  try {
    await client.connect()
  } catch (e) {
    logger.error(`Unable to connect to the MongoDB URI: ${e.toString()}`)
    await sendEvent({ type: 'error', message: `${e.name}: ${e.message}`, stack: e.stack })
    process.exit(1)
  }
  logger.info('Successfully connected to the MongoDB URI')

  logger.info('Pulling Job configuration from DB')
  let job
  try {
    job = await getJob(process.env.JOB_ID)
  } catch (e) {
    logger.error(`Could not load the job from the DB: ${e.toString()}`)
    await sendEvent({ type: 'error', message: `${e.name}: ${e.message}`, stack: e.stack })
    await client.close()
    process.exit(1)
  }

  logger.info('Starting migration process')
  try {
    await migrationAction(client, job)
  } catch (e) {
    await sendEvent({ type: 'error', message: `${e.name}: ${e.message}`, stack: e.stack })
    logger.error(`Unhandled error occurred during migration process: ${e.toString()}`)
  } finally {
    await client.close()
  }

  logger.info('Mongo Migrator stopping!')
}
main()
