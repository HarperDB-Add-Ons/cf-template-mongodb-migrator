import getDatabaseStructure from '../helpers/get-database-structure.js'
import testUri from '../helpers/test-uri.js'

export default async (server, { hdbCore, logger }) => {
  // Get MongoDB database structure
  server.route({
    url: '/job/getDatabaseStructure',
    method: 'POST',
    handler: async (request) => {
      const structure = await getDatabaseStructure(request.body.uri, logger)
      return structure
    }
  })

  // Test MongoDB URI
  server.route({
    url: '/job/testUri',
    method: 'POST',
    handler: async (request) => {
      const result = await testUri(request.body.uri)
      return result
    }
  })

  // Get HarperDB database structure
  server.route({
    url: '/job/describeAll',
    method: 'GET',
    handler: async (request) => {
      let response
      try {
        response = await hdbCore.requestWithoutAuthentication({
          body: {
            operation: 'describe_all'
          }
        })
      } catch (e) {
        logger.error(e)
        return { success: false, message: e.toString() }
      }

      const result = {}
      Object.keys(response).forEach(schema => {
        result[schema] = Object.keys(response[schema])
      })
      return { success: true, schemas: result }
    }
  })

  // Create a new schema or table in HarperDB
  server.route({
    url: '/job/createEntity',
    method: 'POST',
    handler: async (request) => {
      if (request.body.type === 'Schema') {
        try {
          await hdbCore.requestWithoutAuthentication({
            body: {
              operation: 'create_schema',
              schema: request.body.name
            }
          })
          return { success: true }
        } catch (_) {
          return { success: false, message: 'This schema already exists.' }
        }
      } else {
        try {
          await hdbCore.requestWithoutAuthentication({
            body: {
              operation: 'create_table',
              schema: request.body.schema,
              table: request.body.name,
              hash_attribute: 'id'
            }
          })
          return { success: true }
        } catch (e) {
          return { success: false, message: 'This table already exists for this Schema.', error: e.toString() }
        }
      }
    }
  })
}
