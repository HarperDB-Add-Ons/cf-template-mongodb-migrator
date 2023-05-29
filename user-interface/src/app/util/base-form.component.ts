import { Component } from '@angular/core'
import { FormBuilder } from '@angular/forms'

@Component({
  selector: 'app-base-form',
  template: ''
})
export class BaseFormComponent {
  form = this.formBuilder.group({})

  constructor (public formBuilder: FormBuilder) { }

  getControlErrors (field: string, form = null) {
    if (!form) form = this.form
    const control = form.get(field)!
    return control.errors ? Object.keys(control.errors).map(entry => ({ type: entry, error: control.errors![entry] })) : []
  }

  isControlValid (field: string, form = null) {
    if (!form) form = this.form
    const control = form.get(field)!
    if (!control.dirty) return true
    return !control.invalid
  }

  markFieldAsDirty (field: string, form = null) {
    if (!form) form = this.form
    form.get(field)!.markAsDirty()
  }
}