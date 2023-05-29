import { Component, ElementRef, EventEmitter, Input, Output, TemplateRef } from '@angular/core'

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent {
  @Input() display = false
  @Input() title: string = 'Notice'
  @Input() bodyTemplate!: TemplateRef<ElementRef>
  @Input() footerTemplate!: TemplateRef<ElementRef>
  @Output() onClose: EventEmitter<null> = new EventEmitter<null>()
  @Output() onOpen: EventEmitter<null> = new EventEmitter<null>()
  @Input() showCloseBtn: boolean = true

  handleClick (event: any) {
    if (event.target.className.includes('modal-body')) this.hide()
  }

  show () {
    this.display = true
    document.body.classList.add('overflow-hidden')
    this.onOpen.emit()
  }

  hide (sendCloseEvent = true) {
    this.display = false
    document.body.classList.remove('overflow-hidden')
    if (sendCloseEvent) this.onClose.emit()
  }
}
