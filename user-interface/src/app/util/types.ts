export interface JobHistoryList {
  id: string
  status?: 'pending' | 'online' | 'stopped' | 'error'
  configuration?: JobConfiguration[]
  uri?: string
  __createdtime__?: number
  __updatedtime__?: number
}

export interface JobDetail {
  job: JobHistoryList
  task?: JobTask
  analytics?: JobAnalytics
  logs?: string[]
  success?: boolean
}

export interface JobTask {
  jobId: string
  name: string
  status: 'pending' | 'online' | 'stopped' | 'error'
  pid: number
  pmId: number
}

export interface JobAnalytics {
  sourceRecordCount: { total: number, remaining: number } | "---"
  recordsTransferred: number
  transferRate: number | "---"
  lastStart: string
  errorsEncountered: number
  pm2Pid: number | "---"
}

export interface TreeItem  {
  name: string
  size: string
  selected?: 'all' | 'no' | 'some'
  children?: TreeItemChild[]
}

export interface TreeItemChild {
  name: string
  selected: boolean
  size: string
  count: number
}

export interface AlertParameters {
  type: 'info' | 'success' | 'warning' | 'error'
  text: string
  pulse: boolean
}

export interface BaseResponse { success: boolean, message?: string }

export interface AuthPair { username: string, password: string }

export interface HarperDBDescribeAllResponse {
  [key: string]: {
    [key: string]: {
      name: string
      schema: string
    }
  }
}

interface JobSource {
  database: string
  collection: string
}

interface JobTarget {
  schema: string
  table: string
}

export interface JobConfiguration {
  source: JobSource
  target: JobTarget
}

export interface CreateJobPayload {
  uri: string
  configuration: JobConfiguration[]
}

export interface CreateJobResponse {
  success: boolean,
  message?: string
  id?: string
}