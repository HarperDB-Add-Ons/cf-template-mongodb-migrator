import { SCHEMA_NAME } from '../helpers/config.js'
import validateUUID from '../helpers/validate-uuid.js'

export default async (server, { hdbCore, logger }) => {
  // Job Event Creation
  server.route({
    url: '/jobs/:jobId/event',
    method: 'POST',
    handler: async (request) => {
      // Ensure a valid UUID was passed to the route
      if (!validateUUID(request.params.jobId)) {
        return { success: false, message: 'Invalid Job ID provided.' }
      }

      // Ensure an event was sent
      if (!request.body.event) {
        return { success: false, message: 'Event is missing.' }
      }

      // Attempt to save the event
      let response
      try {
        response = await hdbCore.requestWithoutAuthentication({
          body: {
            operation: 'insert',
            schema: SCHEMA_NAME,
            table: 'job_events',
            records: [
              {
                jobId: request.params.jobId,
                ...request.body.event
              }
            ]
          }
        })
      } catch (e) {
        return { success: false, message: e.toString() }
      }

      return { success: true, eventId: response.inserted_hashes[0] }
    }
  })
}
