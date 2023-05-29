export default () => {
  const protocol = process.env.HDB_HTTPS_ON === 'true' ? 'https' : 'http'
  const host = process.env.HDB_HOST ? process.env.HDB_HOST : '127.0.0.1'
  const port = process.env.HDB_CF_PORT ? process.env.HDB_CF_PORT : 9926
  const projectName = process.env.HDB_PROJECT_NAME ? process.env.HDB_PROJECT_NAME : 'mongo-migrator'
  return `${protocol}://${host}:${port}/${projectName}`
}
