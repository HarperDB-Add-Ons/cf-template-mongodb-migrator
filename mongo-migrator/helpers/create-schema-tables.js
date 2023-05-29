import { VERBOSE_LOGGING } from './config.js'

export default async (schema, tables, hdbCore, logger) => {
  // Create the schema
  try {
    await hdbCore.requestWithoutAuthentication({
      body: {
        operation: 'create_schema',
        schema
      }
    })
  } catch (_) {
    if (VERBOSE_LOGGING) logger.notify(`Schema ${schema} exists already.`)
  }

  // Create the tables required
  for (const table of tables) {
    try {
      await hdbCore.requestWithoutAuthentication({
        body: {
          operation: 'create_table',
          schema,
          table,
          hash_attribute: 'id'
        }
      })
    } catch (_) {
      if (VERBOSE_LOGGING) logger.notify(`Table ${schema}.${table} exists already.`)
    }
  }
}
