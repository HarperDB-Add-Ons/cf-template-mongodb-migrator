import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { HistoryStateService } from '../history-state.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html'
})
export class ListComponent implements OnInit {
  constructor(
    private title: Title,
    public historyState: HistoryStateService
  ) { }

  async ngOnInit() {
    this.title.setTitle('Active Migrations' + environment.pageTag)
    await this.historyState.fetchAll()
  }
}
