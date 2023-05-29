import fetch from 'node-fetch'
import http from 'http'
import https from 'https'

import getCfUrl from './get-cf-url.js'
import logger from './logger.js'

export default async (event) => {
  let response
  try {
    const request = await fetch(`${getCfUrl()}/jobs/${process.env.JOB_ID}/event`, {
      method: 'POST',
      body: JSON.stringify({ event }),
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
    response = await request.json()

    // Ensure the request succeeded
    if (request.status !== 200) {
      throw new Error(`Request failed (${response.message || response.error})`)
    }

    // Ensure the event was created
    if (!response.success) {
      throw new Error(`Unable to create event (${response.message || response.error})`)
    }
  } catch (e) {
    logger.error(`Unable to send event: ${e.toString()}`)
  }

  return response
}
