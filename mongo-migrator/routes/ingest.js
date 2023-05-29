import getJob from '../helpers/get-job.js'
import validateUuid from '../helpers/validate-uuid.js'

export default async (server, { hdbCore, logger }) => {
  server.route({
    url: '/ingest/batch',
    method: 'POST',
    handler: async (request) => {
      // Ensure all fields were passed
      if (!request.body.documents || !request.body.jobId || !request.body.dbName || !request.body.collectionName) {
        return {
          success: false,
          message: 'Missing one or more required fields.'
        }
      }

      // Ensure a valid Job ID was supplied
      if (!validateUuid(request.body.jobId)) {
        return {
          success: false,
          message: 'Invalid Job ID supplied.'
        }
      }

      // Ensure a match was found
      const job = await getJob(request.body.jobId, hdbCore)
      if (job === null) {
        return {
          success: false,
          message: 'Job ID was not found.'
        }
      }

      // Grab the target for this source
      const config = job.configuration.find(config =>
        config.source.database === request.body.dbName &&
        config.source.collection === request.body.collectionName
      )

      // Ensure we found the configuration for this source
      if (!config) {
        return {
          success: false,
          message: 'Unable to locate configuration.'
        }
      }

      // Send upsert request
      let response
      try {
        response = await hdbCore.requestWithoutAuthentication({
          body: {
            operation: 'upsert',
            schema: config.target.schema,
            table: config.target.table,
            records: request.body.documents.map(document => {
              document.id = document._id
              document.__source__ = 'mongo-migrator'
              delete document._id
              return document
            })
          }
        })
      } catch (e) {
        return {
          success: false,
          message: e.toString()
        }
      }

      return {
        success: true,
        message: response.message,
        insertedIds: response.inserted_hashes
      }
    }
  })
}
