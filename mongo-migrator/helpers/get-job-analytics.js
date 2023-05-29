import { SCHEMA_NAME } from './config.js'

export default async (jobId, configuration, hdbCore, logger) => {
  const events = await hdbCore.requestWithoutAuthentication({
    body: {
      operation: 'search_by_value',
      schema: SCHEMA_NAME,
      table: 'job_events',
      search_attribute: 'jobId',
      search_value: jobId,
      get_attributes: ['*']
    }
  })

  // Get the total amount of records transferred
  const transferEvents = events.filter(event => event.type === 'transfer')
  const totalTransferred = transferEvents.reduce((a, cVal) => a + cVal.rowCount, 0)

  // Get the transfer rate
  transferEvents.sort((a, b) => a.__createdtime__ - b.__createdtime__) // Sort asc
  let totalExecutionSeconds = '---'
  let transferRate = '---'
  if (transferEvents.length >= 2) {
    totalExecutionSeconds = (transferEvents[transferEvents.length - 1].__createdtime__ - transferEvents[0].__createdtime__) / 1000
    transferRate = (totalTransferred / totalExecutionSeconds).toFixed(1)
  }

  // Get the latest source count
  const sourceCountEvents = events.filter(event => event.type === 'source_count')
  sourceCountEvents.sort((a, b) => b.__createdtime__ - a.__createdtime__) // Sort desc
  let sourceRecordCount = '---'
  const recordTotal = { total: 0, remaining: 0 }
  if (sourceCountEvents.length) {
    configuration.forEach(config => {
      const countEvents = sourceCountEvents.filter(event =>
        event.databaseName === config.source.database &&
        event.collectionName === config.source.collection
      )
      if (countEvents.length) {
        recordTotal.total += countEvents[0].totalCount
        recordTotal.remaining += countEvents[0].remainingCount
      }
    })
    if (recordTotal.total !== 0) {
      if (recordTotal.total === recordTotal.remaining) {
        recordTotal.remaining = recordTotal.total - totalTransferred
      }
      sourceRecordCount = recordTotal
    }
  }

  // Get the last start event
  const startEvents = events.filter(event => event.type === 'job_start')
  startEvents.sort((a, b) => b.__createdtime__ - a.__createdtime__) // Sort desc
  let lastStart = '---'
  let pm2Pid = '---'
  if (startEvents.length) {
    lastStart = new Date(startEvents[0].__createdtime__).toISOString()
    pm2Pid = startEvents[0].pid
  }

  // Get the errors
  const errorEvents = events.filter(event => event.type === 'error')

  return {
    sourceRecordCount,
    recordsTransferred: totalTransferred,
    transferRate,
    lastStart,
    errorsEncountered: errorEvents.length,
    pm2Pid
  }
}
