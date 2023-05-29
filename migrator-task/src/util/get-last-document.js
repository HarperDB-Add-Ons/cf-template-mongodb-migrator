import fetch from 'node-fetch'
import http from 'http'
import https from 'https'

import getCfUrl from './get-cf-url.js'

export default async (database, collection) => {
  const response = await fetch(`${getCfUrl()}/jobs/${process.env.JOB_ID}/getLastDocument`, {
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify({ database, collection }),
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

  return response.json()
}
