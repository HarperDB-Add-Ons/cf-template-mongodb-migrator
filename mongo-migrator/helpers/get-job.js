import Cryptr from 'cryptr'

import { SCHEMA_NAME, HASH_KEY } from './config.js'

const cryptr = new Cryptr(HASH_KEY)

export default async (jobId, hdbCore) => {
  const jobQuery = await hdbCore.requestWithoutAuthentication({
    body: {
      operation: 'search_by_hash',
      schema: SCHEMA_NAME,
      table: 'jobs',
      hash_values: [jobId],
      get_attributes: ['*']
    }
  })

  // Ensure the job was returned
  if (!jobQuery.length) {
    return null
  }

  const job = jobQuery[0]

  // Decrypt the URI
  job.uri = cryptr.decrypt(job.uri)

  return job
}
