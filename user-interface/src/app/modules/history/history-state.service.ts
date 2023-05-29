import { Injectable } from '@angular/core'
import { BehaviorSubject, firstValueFrom } from 'rxjs'

import { AuthPair, HarperDBDescribeAllResponse, JobDetail, JobHistoryList, TreeItem } from 'src/app/util/types'
import { HistoryService } from './history.service'
import { ToastrService } from 'ngx-toastr'

@Injectable({ providedIn: 'root' })
export class HistoryStateService {
  /** History */
  private readonly _history = new BehaviorSubject<JobHistoryList[]>([])
  readonly history$ = this._history.asObservable()

  get history (): JobHistoryList[] {
    return this._history.getValue()
  }

  set history (val: JobHistoryList[]) {
    this._history.next(val)
  }

  /** Mongo URI */
  private readonly _uri = new BehaviorSubject<string>('')
  readonly uri$ = this._uri.asObservable()

  get uri (): string {
    return this._uri.getValue()
  }

  set uri (val: string) {
    this._uri.next(val)
  }

  /** Database structure */
  private readonly _structure = new BehaviorSubject<TreeItem[]>([])
  readonly structure$ = this._structure.asObservable()

  get structure (): TreeItem[] {
    return this._structure.getValue()
  }

  set structure (val: TreeItem[]) {
    this._structure.next(val)
  }

  /** HarperDB Schemas/tables */
  private readonly _schema = new BehaviorSubject<HarperDBDescribeAllResponse>({})
  readonly schema$ = this._schema.asObservable()

  get schema (): HarperDBDescribeAllResponse {
    return this._schema.getValue()
  }

  set schema (val: HarperDBDescribeAllResponse) {
    this._schema.next(val)
  }

  /** Loading */
  private readonly _loading = new BehaviorSubject<boolean>(false)
  readonly loading$ = this._loading.asObservable()

  get loading (): boolean {
    return this._loading.getValue()
  }

  set loading (val: boolean) {
    this._loading.next(val)
  }

  /** Credentials */
  private readonly _credentials = new BehaviorSubject<AuthPair>({
    username: '',
    password: ''
  })
  readonly credentials$ = this._credentials.asObservable()

  get credentials (): AuthPair {
    return this._credentials.getValue()
  }

  set credentials (val: AuthPair) {
    this._credentials.next(val)
  }

  /** Job Detail */
  private readonly _jobDetail = new BehaviorSubject<JobDetail>({
    job: { id: '' }
  })
  readonly job$ = this._jobDetail.asObservable()

  get jobDetail (): JobDetail {
    return this._jobDetail.getValue()
  }

  set jobDetail (val: JobDetail) {
    this._jobDetail.next(val)
  }

  jobLoadError = false

  /** Methods */
  constructor (
    private historyService: HistoryService,
    private toastr: ToastrService
  ) {
    // this.fetchAll()
  }

  resetAllSteps () {
    this.credentials = null
    this.schema = null
    this.structure = null
    this.uri = null
  }

  async getDatabaseStructure (uri: string) {
    // Clear out the old data
    this.structure = []
    
    this.loading = true
    let response: { success: boolean; structure: TreeItem[]; }
    try {
      response = await firstValueFrom(this.historyService.getDatabaseStructure(uri))
    } catch (e) {
      console.error(e)
      this.loading = false
      return
    }
    this.loading = false

    if (response.success) {
      this.structure = response.structure.map(database => ({
        name: database.name,
        selected: 'no',
        size: database.size,
        children: database.children?.map(child => ({
          name: child.name,
          selected: false,
          size: child.size,
          count: child.count
        }))
      }))
    }
  }

  async getSchemas ()  {
    // Clear out the old data
    this.schema = {}

    this.loading = true
    try {
      this.schema = await firstValueFrom(this.historyService.describeAll({
        username: this.credentials.username,
        password: this.credentials.password
      }))
    } catch (e) {
      console.error(e)
    }
    this.loading = false
  }

  async getJobDetail (jobId: string, showSpinner = true)  {
    if (showSpinner) this.loading = true
    try {
      this.jobDetail = await firstValueFrom(this.historyService.getJobDetail(jobId))
    } catch (e) {
      console.error(e)
      this.jobLoadError = true
    }
    if (showSpinner) this.loading = false
  }

  async fetchAll (showSpinner = true) {
    if (showSpinner) this.loading = true
    try {
      this.history = await firstValueFrom(this.historyService.getExistingJobs())
    } catch (e) {
      this.toastr.error(`Error loading jobs: ${e.message}`)
      console.error(e)
    }
    if (showSpinner) this.loading = false
  }
}