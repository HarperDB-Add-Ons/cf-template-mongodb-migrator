import pm2 from 'pm2'
import { promisify } from 'util'

import { SCHEMA_NAME, VERBOSE_LOGGING } from './config.js'
import getMigratorTasks from './get-migrator-tasks.js'
import addPM2Task from './add-pm2-task.js'

const connectPromise = promisify(pm2.connect).bind(pm2)
const stopPromise = promisify(pm2.stop).bind(pm2)
const restartPromise = promisify(pm2.restart).bind(pm2)
const deletePromise = promisify(pm2.delete).bind(pm2)

export default async (job, action, hdbCore, logger) => {
  const list = await getMigratorTasks()
  const task = list.find(e => e.jobId === job.id)

  // If this task doesn't exist, we need to re-create it.
  if (!task && action !== 'delete') {
    try {
      await addPM2Task(hdbCore, job.uri, job.id)
    } catch (e) {
      if (VERBOSE_LOGGING) logger.error(`Unable to add PM2 Task: ${e.toString()}`)
      throw e
    }
    if (VERBOSE_LOGGING) logger.info(`Recreated missing task for Job ${job.id}`)
  }

  await connectPromise()

  let newStatus = 'pending'
  try {
    switch (action) {
      case 'start':
        await restartPromise(task.pmId)
        newStatus = 'online'
        break
      case 'stop':
        await stopPromise(task.pmId)
        newStatus = 'stopped'
        break
      case 'delete':
        await deletePromise(task.pmId)
        break
      default:
        throw new Error(`Unsupported action: ${action}`)
    }
  } catch (e) {
    pm2.disconnect()
    if (VERBOSE_LOGGING) logger.error(`Unable to ${action} PM2 Task: ${e.toString()}`)
    throw e
  }

  pm2.disconnect()

  // We don't need to update a deleted job
  if (action === 'delete') return

  // Update the job status
  await hdbCore.requestWithoutAuthentication({
    body: {
      operation: 'sql',
      sql: `UPDATE ${SCHEMA_NAME}.jobs SET status = '${newStatus}' WHERE id = '${job.id}'`
    }
  })
}
