import pm2 from 'pm2'
import { promisify } from 'util'

const connectPromise = promisify(pm2.connect).bind(pm2)
const listPromise = promisify(pm2.list).bind(pm2)

export default async () => {
  await connectPromise()

  let list = await listPromise()
  list = list
    .filter(task => task.name.includes('MongoDB Migrator'))
    .map(app => ({
      jobId: app.pm2_env.JOB_ID,
      name: app.name,
      status: app.pm2_env.status,
      pid: app.pid,
      pmId: app.pm_id
    }))

  pm2.disconnect()

  return list
}
