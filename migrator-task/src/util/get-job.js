import fetch from 'node-fetch'
import http from 'http'
import https from 'https'

import getCfUrl from './get-cf-url.js'

export default async (jobId) => {
  const response = await fetch(`${getCfUrl()}/jobs/${jobId}`, {
    method: 'get',
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

  if (body.success) {
    return body.job
  }
  throw new Error(body.message)
}
