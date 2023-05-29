import fetch from 'node-fetch'
import http from 'http'
import https from 'https'
import pRetry from 'p-retry'

import getCfUrl from './get-cf-url.js'
import logger from './logger.js'

const sendBatch = async (url, payload) => {
  const response = await fetch(`${url}/ingest/batch`, {
    method: 'post',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
    agent: (_parsedURL) => {
      if (_parsedURL.protocol === 'http:') {
        return new http.Agent()
      } else {
        return new https.Agent({
          rejectUnauthorized: process.env.REJECT_UNAUTHORIZED_CERTS === 'true' || false
        })
      }
    }
  })

  const body = await response.json()

  return { response, body }
}

export default async (chunk, dbName, collectionName) => {
  // Craft the payload
  const payload = {
    jobId: process.env.JOB_ID,
    documents: chunk,
    dbName,
    collectionName
  }

  // Submit the request with 5 retries
  const response = await pRetry(() => sendBatch(getCfUrl(), payload), { retries: 5 })
  return response
}
