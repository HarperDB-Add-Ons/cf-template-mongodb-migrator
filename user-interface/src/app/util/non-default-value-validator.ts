import { AbstractControl } from "@angular/forms";

const DEFAULT_VALUES = [
  'Schema Name',
  'Table Name',
  '+ Create New'
]

export const ensureNonDefaultValue = (control: AbstractControl) => {
  if (DEFAULT_VALUES.includes(control.value)) {
    return { defaultValue: true }
  }
  return null
}
