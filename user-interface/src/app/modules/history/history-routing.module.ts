import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { NewJobComponent } from './new-job/new-job.component';
import { ListComponent } from './list/list.component';
import { JobDetailComponent } from './job-detail/job-detail.component';

const routes: Routes = [
  { path: '', component: ListComponent },
  { path: 'job/new', component: NewJobComponent },
  { path: 'job/:jobId', component: JobDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HistoryRoutingModule { }
