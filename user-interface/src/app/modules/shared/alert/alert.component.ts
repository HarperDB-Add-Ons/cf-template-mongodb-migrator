import { Component, Input } from '@angular/core';

import { AlertParameters } from 'src/app/util/types';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html'
})
export class AlertComponent {
  @Input('params') params: AlertParameters = {
    type: 'info', text: '', pulse: false
  }
}
