import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'

import { getApiUrl } from 'src/app/util/get-api-url'
import {
  AuthPair,
  BaseResponse,
  CreateJobPayload,
  HarperDBDescribeAllResponse,
  JobDetail,
  JobHistoryList,
  TreeItem
} from 'src/app/util/types'

@Injectable({ providedIn: 'root' })
export class HistoryService {
  // Base headers to include with every request
  baseOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  }
  
  constructor (
    private http: HttpClient
  ) { }

  getExistingJobs () {
    return this.http.get<JobHistoryList[]>(
      `${getApiUrl()}jobs`,
      this.baseOptions
    )
  }

  testMongoUri (uri: string) {
    return this.http.post<{ valid: boolean, message?: string }>(
      `${getApiUrl()}job/testUri`,
      { uri },
      this.baseOptions
    )
  }

  getDatabaseStructure (uri: string) {
    return this.http.post<{ success: boolean, structure: TreeItem[] }>(
      `${getApiUrl()}job/getDatabaseStructure`,
      { uri },
      this.baseOptions
    )
  }

  createEntity (name: string, type: 'Schema' | 'Table', schema = '') {
    return this.http.post<BaseResponse>(
      `${getApiUrl()}job/createEntity`,
      { name, type, schema },
      this.baseOptions
    )
  }

  validateCredentials (credentials: AuthPair) {
    return this.http.post<{ username?: string, message?: string }>(
      `${getApiUrl()}passthrough`,
      { operation: 'user_info' },
      {
        headers: {
          Authorization: `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`,
          'Content-Type': 'application/json'
        }
      }
    )
  }

  describeAll (credentials: AuthPair) {
    return this.http.post<HarperDBDescribeAllResponse>(
      `${getApiUrl()}passthrough`,
      { operation: 'describe_all' },
      {
        headers: {
          Authorization: `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`,
          'Content-Type': 'application/json'
        }
      }
    )
  }

  createJob (payload: CreateJobPayload) {
    return this.http.post<BaseResponse>(
      `${getApiUrl()}jobs`,
      payload,
      this.baseOptions
    )
  }

  getJobDetail (jobId: string) {
    return this.http.get<JobDetail>(
      `${getApiUrl()}jobs/${jobId}`,
      this.baseOptions
    )
  }

  sendJobAction (jobId: string, action: 'start' | 'stop') {
    return this.http.put<BaseResponse>(
      `${getApiUrl()}jobs/${jobId}/${action}`,
      this.baseOptions
    )
  }

  deleteJob (jobId: string) {
    return this.http.delete<BaseResponse>(
      `${getApiUrl()}jobs/${jobId}`,
      this.baseOptions
    )
  }
}
