import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { ListComponent } from './list/list.component';
import { HistoryRoutingModule } from './history-routing.module';
import { SharedModule } from '../shared/shared.module';
import { NewJobComponent } from './new-job/new-job.component';
import { JobDetailComponent } from './job-detail/job-detail.component';
import { TimeagoFixPipe } from 'src/app/util/time-ago-pipe';

@NgModule({
  declarations: [
    ListComponent,
    NewJobComponent,
    JobDetailComponent,
    TimeagoFixPipe
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    HistoryRoutingModule,
    SharedModule
  ],
  exports: [
  ]
})
export class HistoryModule { }
