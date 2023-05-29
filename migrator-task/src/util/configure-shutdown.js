import logger from './logger.js'

const close = async (client, code) => {
  await client.close(true)
  logger.info('Closing DB connection!')
  process.exit(code)
}

export default (client) => {
  ['exit', 'SIGINT', 'SIGTERM', 'uncaughtException'].forEach(signal =>
    process.on(signal, (code) => close(client, code))
  )
}
