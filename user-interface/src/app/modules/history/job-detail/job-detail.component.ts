import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

import { BaseResponse } from 'src/app/util/types';
import { HistoryStateService } from '../history-state.service';
import { HistoryService } from '../history.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-job-detail',
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.css']
})
export class JobDetailComponent implements OnInit, OnDestroy {
  jobId: string
  subscriptions = []
  isRefreshing = false
  refreshTimer: ReturnType<typeof setInterval>

  constructor(
    public historyState: HistoryStateService,
    private historyService: HistoryService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private router: Router,
    private title: Title
  ) { }

  async deleteJob () {
    if (confirm('Are you sure you want to remove this Job?')) {
      let response: BaseResponse
      try {
        this.historyState.loading = true
        response = await firstValueFrom(this.historyService.deleteJob(this.jobId))
      } catch (e) {
        console.error(e)
        this.toastr.error(`Unable to remove job: ${e.error.message || e.error.error}`)
      }
      this.historyState.loading = false

      if (response && response.success) {
        this.toastr.success('Job removed successfully.')
        this.router.navigate(['/'])
      } else {
        this.toastr.error(`Unable to remove job: ${response.message}`)
      }
    }
  }

  getRemainingFiles () {
    if (this.historyState.jobDetail.analytics.sourceRecordCount === '---') {
      return 'N/A'
    }
    const total = this.historyState.jobDetail.analytics.sourceRecordCount.total
    const remaining = this.historyState.jobDetail.analytics.sourceRecordCount.remaining
    if (remaining === total) {
      return (total - this.historyState.jobDetail.analytics.recordsTransferred).toLocaleString()
    }
    return remaining.toLocaleString()
  }

  refreshJob () {
    this.isRefreshing = true
    setTimeout(() => this.isRefreshing = false, 1000)
    this.loadJob(false)
  }

  async sendJobAction (action: 'start' | 'stop') {
    // Send the action
    let response: BaseResponse
    this.historyState.loading = true
    try {
      response = await firstValueFrom(
        this.historyService.sendJobAction(this.jobId, action)
      )
    } catch (e) {
      console.error(e)
      this.toastr.error(`Job ${action} failed: ${e.error.message || e.error.error}`)
    }
    this.historyState.loading = false
    if (!response) return
    
    if (response.success) {
      const actionLabel = action === 'start' ? 'started' : 'stopped'
      this.toastr.success(`Job successfully ${actionLabel}.`)
      await this.loadJob()
    } else {
      this.toastr.error(`Job ${action} failed: ${response.message}`)
    }
  }

  async loadJob(showSpinner = true) {
    await this.historyState.getJobDetail(this.jobId, showSpinner)
    if (this.historyState.jobLoadError) {
      this.router.navigate(['/'])
    }
    if (!this.historyState.jobDetail.success) {
      this.toastr.error('Unable to load Job - check error console.')
      return
    }
  }

  onParamsLoaded (params: Params) {
    this.jobId = params['jobId']

    this.loadJob()
  }

  get recordsTransferred () {
    const sourceCount = this.historyState.jobDetail.analytics.sourceRecordCount
    const transferred = this.historyState.jobDetail.analytics.recordsTransferred
    if (sourceCount !== '---' && transferred > sourceCount.total) {
      const total = sourceCount.total
      const delta = transferred - total
      const plural = delta === 1 ? ''  : 's'
      return `${total.toLocaleString()} (+${delta.toLocaleString()} update${plural})`
    }
    return transferred.toLocaleString()
  }

  get logs () {
    if (this.historyState.jobDetail.logs.length) {
      return this.historyState.jobDetail.logs.join('\n')
    }
    return 'No logs created yet.'
  }

  get jobPID () {
    return this.historyState.jobDetail.task.pid || this.historyState.jobDetail.analytics.pm2Pid
  }

  get jobIsOnline () {
    return this.historyState.jobDetail.task.status === 'online'
  }

  get hasLastStart ()  {
    return this.historyState.jobDetail.analytics.lastStart !== '---'
  }

  get hasTransferRate () {
    return this.historyState.jobDetail.analytics.transferRate != '---'
  }

  get hasSourceRecordCount () {
    return this.historyState.jobDetail.analytics.sourceRecordCount !== '---'
  }

  get sourceRecordCount () {
    if (this.historyState.jobDetail.analytics.sourceRecordCount !== '---') {
      const total = this.historyState.jobDetail.analytics.sourceRecordCount.total
      return `${total.toLocaleString()} (${this.getRemainingFiles()} remaining)`
    }
    return '---'
  }

  ngOnInit(): void {
    this.title.setTitle('Job Detail' + environment.pageTag)
    this.historyState.loading = true
    this.subscriptions.push(
      this.route.params.subscribe(params => this.onParamsLoaded(params))
    )
    // Refresh the screen state every 15s
    this.refreshTimer = setInterval(() => this.refreshJob(), 15 * 1000)
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe())
    if (this.refreshTimer) clearInterval(this.refreshTimer)
  }

  tsAsDate (ts: number | string, offset = false) {
    if (!offset) return new Date(ts)
    return new Date(ts).getTimezoneOffset()/60
  }

}
