import { SCHEMA_NAME, TABLE_NAMES } from '../helpers/config.js'
import createSchemaTables from '../helpers/create-schema-tables.js'

export default async (server, { hdbCore, logger }) => {
  // Initialize the database
  try {
    await createSchemaTables(SCHEMA_NAME, TABLE_NAMES, hdbCore, logger)
  } catch (e) {
    logger.notify(`Migrator init failed: ${e.toString()}`)
  }

  // Simple passthrough to the underlying HarperDB API
  server.route({
    url: '/passthrough',
    method: 'POST',
    preValidation: hdbCore.preValidation,
    handler: hdbCore.request
  })
}
