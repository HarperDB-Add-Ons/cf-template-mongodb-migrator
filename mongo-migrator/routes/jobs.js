import Cryptr from 'cryptr'
import { unlink } from 'fs/promises'
import * as glob from 'glob'
import { resolve } from 'path'

import { SCHEMA_NAME, VERBOSE_LOGGING, HASH_KEY } from '../helpers/config.js'
import addPM2Task from '../helpers/add-pm2-task.js'
import getJobAnalytics from '../helpers/get-job-analytics.js'
import getJobLogs from '../helpers/get-job-logs.js'
import getJob from '../helpers/get-job.js'
import getMongoUrl from '../helpers/get-mongo-url.js'
import getMigratorTasks from '../helpers/get-migrator-tasks.js'
import validateUUID from '../helpers/validate-uuid.js'
import controlTaskPower from '../helpers/control-task-power.js'
import { validateJobCreateSchema, validateJobLastDocumentSchema } from '../helpers/schemas.js'
import createSchemaTables from '../helpers/create-schema-tables.js'

const cryptr = new Cryptr(HASH_KEY)

export default async (server, { hdbCore, logger }) => {
  // Get the latest document ID in the requested table (for the migration jobs)
  server.route({
    url: '/jobs/:jobId/getLastDocument',
    method: 'POST',
    handler: async (request) => {
      // Validate body schema
      const validate = validateJobLastDocumentSchema(request.body)
      if (!validate) {
        return {
          success: false,
          message: 'The request you have sent is not valid.',
          bodyErrors: validateJobLastDocumentSchema.errors
        }
      }

      // Ensure a valid UUID was passed to the route
      if (!validateUUID(request.params.jobId)) {
        return { success: false, message: 'Invalid Job ID provided.' }
      }

      // Ensure a match was found
      const job = await getJob(request.params.jobId, hdbCore)
      if (job === null) {
        return {
          success: false,
          message: 'Job ID was not found.'
        }
      }

      // Ensure a valid target was passed
      const config = job.configuration.find(config =>
        config.source.database === request.body.database &&
        config.source.collection === request.body.collection
      )
      if (!config) {
        return {
          success: false,
          message: 'Specified source was not found in the collection.'
        }
      }

      // Submit query
      const response = await hdbCore.requestWithoutAuthentication({
        body: {
          operation: 'sql',
          sql: `SELECT id FROM ${config.target.schema}.${config.target.table} WHERE __source__ = 'mongo-migrator' ORDER BY __updatedtime__ DESC LIMIT 1`
        }
      })

      return {
        success: true,
        lastId: response && response.length ? response[0].id : null
      }
    }
  })

  // Delete job
  server.route({
    url: '/jobs/:jobId',
    method: 'DELETE',
    handler: async (request) => {
      // Ensure a valid UUID was passed to the route
      if (!validateUUID(request.params.jobId)) {
        return { success: false, message: 'Invalid Job ID provided.' }
      }

      // Load the job / ensure it's a valid jobId
      const job = await getJob(request.params.jobId, hdbCore)
      if (job === null) {
        return {
          success: false,
          message: 'Job ID was not found.'
        }
      }

      // Delete the job
      await hdbCore.requestWithoutAuthentication({
        body: {
          operation: 'sql',
          sql: `DELETE FROM ${SCHEMA_NAME}.jobs WHERE id = '${request.params.jobId}'`
        }
      })

      // Delete the PM2 task
      try {
        await controlTaskPower(job, 'delete', hdbCore, logger)
      } catch (e) {
        return { success: false, error: `Unable to remove PM2 Task: ${e.toString()}` }
      }

      // Delete the logs
      const configuration = await hdbCore.requestWithoutAuthentication({
        body: { operation: 'get_configuration' }
      })
      const logPath = resolve(configuration.HDB_ROOT, 'log/mongo-migrator')
      try {
        const files = await glob.glob(resolve(logPath, `combined-${request.params.jobId.substring(24)}*`))
        for (const file of files) {
          await unlink(file)
        }
      } catch (e) {
        return {
          success: false,
          message: `Unable to remove Job logs: ${e.toString()}`
        }
      }

      return { success: true }
    }
  })

  // Trigger an action for a job
  server.route({
    url: '/jobs/:jobId/:action',
    method: 'PUT',
    handler: async (request) => {
      // Ensure a valid UUID was passed to the route
      if (!validateUUID(request.params.jobId)) {
        return { success: false, message: 'Invalid Job ID provided.' }
      }

      // Ensure a valid action was passed
      if (!['start', 'stop'].includes(request.params.action)) {
        return { success: false, message: `Unsupported action: ${request.params.action}` }
      }

      // Load the job
      const job = await getJob(request.params.jobId, hdbCore)
      if (job === null) {
        return {
          success: false,
          message: 'Job ID was not found.'
        }
      }

      // Send the power command
      try {
        await controlTaskPower(job, request.params.action, hdbCore, logger)
      } catch (e) {
        return { success: false, message: e.toString() }
      }

      return { success: true }
    }
  })

  // Return a specific job from the DB
  server.route({
    url: '/jobs/:jobId',
    method: 'GET',
    handler: async (request) => {
      // Ensure a valid UUID was passed to the route
      if (!validateUUID(request.params.jobId)) {
        return { success: false, message: 'Invalid Job ID provided.' }
      }

      // Ensure a match was found
      const job = await getJob(request.params.jobId, hdbCore)
      if (job === null) {
        return { success: false, message: 'Job ID was not found.' }
      }

      // Modify the URI to just the FQDN
      job.uri = getMongoUrl(job.uri)

      // Fetch analytics
      let analytics
      try {
        analytics = await getJobAnalytics(request.params.jobId, job.configuration, hdbCore, logger)
      } catch (e) {
        return { success: false, message: e.toString() }
      }

      // Fetch logs
      let logs = []
      try {
        logs = await getJobLogs(request.params.jobId, hdbCore, logger)
      } catch (e) {
        return { success: false, message: e.toString() }
      }

      // Fetch task
      let tasks = []
      try {
        tasks = await getMigratorTasks()
      } catch (e) {
        return { success: false, message: e.toString() }
      }

      const task = tasks.find(t => t.jobId === request.params.jobId)
      job.status = task ? task.status : 'stopped'

      return {
        success: true,
        job,
        task,
        analytics,
        logs
      }
    }
  })

  // Return all jobs from the DB
  server.route({
    url: '/jobs',
    method: 'GET',
    handler: async (request) => {
      const jobs = await hdbCore.requestWithoutAuthentication({
        body: {
          operation: 'sql',
          sql: `SELECT * FROM ${SCHEMA_NAME}.jobs ORDER BY __createdtime__ ASC`
        }
      })

      for (const job of jobs) {
        // Decrypt the URI
        job.uri = cryptr.decrypt(job.uri)
        // Modify the URI to just the FQDN
        job.uri = getMongoUrl(job.uri)

        // Fetch analytics
        let analytics
        try {
          analytics = await getJobAnalytics(job.id, job.configuration, hdbCore, logger)
        } catch (e) {
          return { success: false, message: e.toString() }
        }

        job.analytics = analytics

        // Fetch task
        let tasks = []
        try {
          tasks = await getMigratorTasks()
        } catch (e) {
          return { success: false, message: e.toString() }
        }

        const task = tasks.find(t => t.jobId === job.id)
        job.status = task ? task.status : 'stopped'
      }

      return jobs
    }
  })

  // Create a new Job
  server.route({
    url: '/jobs',
    method: 'POST',
    handler: async (request) => {
      // Validate body schema
      const validate = validateJobCreateSchema(request.body)
      if (!validate) {
        return {
          success: false,
          message: 'The request you have sent is not valid.',
          bodyErrors: validateJobCreateSchema.errors
        }
      }

      const { uri, configuration } = request.body

      // Ensure the requested schemas/tables exist
      for (const config of request.body.configuration) {
        try {
          await createSchemaTables(config.target.schema, [config.target.table], hdbCore, logger)
        } catch (e) {
          return {
            success: false,
            message: `Creating the schema/table failed: ${e.toString()}`
          }
        }
      }

      let response
      try {
        response = await hdbCore.requestWithoutAuthentication({
          body: {
            operation: 'insert',
            schema: SCHEMA_NAME,
            table: 'jobs',
            records: [
              {
                uri: cryptr.encrypt(uri),
                status: 'pending',
                configuration
              }
            ]
          }
        })
      } catch (e) {
        if (VERBOSE_LOGGING) logger.error(`Unable to save job record: ${e.toString()}`)
        return { success: false, message: e.toString() }
      }

      let task
      try {
        task = await addPM2Task(hdbCore, uri, response.inserted_hashes[0])
      } catch (e) {
        if (VERBOSE_LOGGING) logger.error(`Unable to add PM2 Task: ${e.toString()}`)
        return { success: false, message: e.toString() }
      }

      return {
        success: true,
        message: response.message,
        id: response.inserted_hashes[0],
        task
      }
    }
  })
}
