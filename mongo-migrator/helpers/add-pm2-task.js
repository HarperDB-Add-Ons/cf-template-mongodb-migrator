import { dirname, resolve } from 'path'
import pm2 from 'pm2'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

import { HDB_HOST, FAIL_ON_HISTORY_ERROR } from './config.js'
import getConfig from './get-config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const connectPromise = promisify(pm2.connect).bind(pm2)
const startPromise = promisify(pm2.start).bind(pm2)

export default async (hdbCore, mongoUri, jobId) => {
  await connectPromise()

  // Grab configuration and function name
  const config = await getConfig(hdbCore)
  const pathParts = __dirname.split('/')

  let start
  try {
    start = await startPromise({
      script: resolve(__dirname, '../migrator-task/src/job.js'),
      name: `MongoDB Migrator - ${jobId.substring(24)}`,
      env: {
        MONGO_URI: mongoUri,
        JOB_ID: jobId,
        HDB_HTTPS_ON: config.HTTPS_ON ? 'true' : 'false',
        HDB_HOST,
        HDB_CF_PORT: config.CUSTOM_FUNCTIONS_PORT,
        HDB_PROJECT_NAME: pathParts[pathParts.length - 2],
        REJECT_UNAUTHORIZED_CERTS: config.ALLOW_SELF_SIGNED_SSL_CERTS ? 'false' : 'true',
        FAIL_ON_HISTORY_ERROR
      }
    })
  } catch (e) {
    pm2.disconnect()
    throw e
  }

  pm2.disconnect()

  if (start) {
    return {
      pid: start[0].pid,
      pmId: start[0].pm2_env.pm_id
    }
  } else {
    throw new Error('Unable to start PM2 Task for Job')
  }
}
