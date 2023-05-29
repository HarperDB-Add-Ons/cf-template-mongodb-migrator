import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { BaseFormComponent } from 'src/app/util/base-form.component';
import { AlertParameters, BaseResponse, CreateJobResponse, JobDetail } from 'src/app/util/types';
import { ModalComponent } from '../../shared/modal/modal.component';
import { TreeViewComponent } from '../../shared/tree-view/tree-view.component';
import { HistoryStateService } from '../history-state.service';
import { HistoryService } from '../history.service';
import { ensureNonDefaultValue } from 'src/app/util/non-default-value-validator';
import { environment } from 'src/environments/environment';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

@Component({
  selector: 'app-new-job',
  templateUrl: './new-job.component.html',
  styleUrls: ['./new-job.component.css']
})
export class NewJobComponent extends BaseFormComponent implements OnInit  {
  stepNumber = 1
  stepChangeDisabled = false
  modalMode: 'Schema' | 'Table' = 'Schema'
  entityModalTemp: {index: number, schema?: string} = null

  @ViewChild('treeView') treeViewComponent!: TreeViewComponent
  @ViewChild('entityModal', { static: false }) entityModal!: ModalComponent

  override form = this.fb.group({
    uri: this.fb.control(this.historyState.uri, [
      Validators.required, Validators.pattern('^(mongodb://)(.+)')
    ]),
    targets: this.fb.array([]),
    credentials: this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    })
  })

  entityModalForm = this.fb.group({
    name: ['', Validators.required],
  })

  alertParams: AlertParameters = {
    type: 'info', text: '', pulse: false
  }

  entityModalAlertParams: AlertParameters = {
    type: 'info', text: '', pulse: false
  }

  targetReference = []

  async showConfirmation () {
    this.clearAlert('form')

    if (!this.form.valid) {
      // Mark each row as dirty
      const targets = this.form.get('targets') as FormArray
      for (let i = 0; i < targets.controls.length; i++) {
        const target = targets.at(i) as FormGroup
        ['schema', 'table'].forEach(field => target.get(field).markAsDirty())
      }
      this.setAlert('One or more fields are missing.', 'error', 'form')
      return
    }

    const form = this.form.value

    const payload = {
      uri: form.uri,
      configuration: this.targetReference.map((targetRef, index) => {
        return {
          source: {
            database: targetRef.database,
            collection: targetRef.collection
          },
          target: {
            schema: form.targets[index].schema,
            table: form.targets[index].table
          }
        }
      })
    }

    this.stepChangeDisabled = true
    let response: CreateJobResponse
    try {
      response = await firstValueFrom(this.historyService.createJob(payload))
    } catch (e) {
      console.error(e)
      this.setAlert(`Error creating job: ${e.error.message || e.error.error}`, 'error', 'form')
      this.stepChangeDisabled = false
      return
    }

    if (response.success) {
      this.historyState.resetAllSteps()
      this.router.navigate(['/', 'job', response.id])
    } else {
      this.setAlert(`Error creating job: ${response.message}`, 'error', 'form')
      this.stepChangeDisabled = false
    }
  }

  async waitUntilJobPropagated (jobId: string) {
    const maxTries = 10
    let i = 0
    while (i < maxTries) {
      await sleep(1000)
      i++
      let response: JobDetail
      try {
        response = await firstValueFrom(this.historyService.getJobDetail(jobId))
      } catch (_) {
        continue
      }
      if (response.success) return
    }
  }

  isSelectedDisabled (index: number) {
    const targets = this.form.get('targets') as FormArray
    const target = targets.at(index) as FormGroup
    const targetValue = target.get('schema').value
    if (targetValue && Object.keys(this.historyState.schema).includes(targetValue)) {
      return false
    }
    return true
  }

  getSchemas () {
    return Object.keys(this.historyState.schema)
  }

  getTables (index: number) {
    const targets = this.form.get('targets') as FormArray
    const target = targets.at(index) as FormGroup
    const targetValue = target.get('schema').value
    if (targetValue && Object.keys(this.historyState.schema).includes(targetValue)) {
      return Object.keys(this.historyState.schema[targetValue])
    }
    return []
  }

  get credentials () {
    return this.form.controls["credentials"] as FormGroup
  }

  getModalTitle () {
    return `Create New ${this.modalMode}`
  }

  get targets() {
    return this.form.controls["targets"] as FormArray;
  }

  onEntityModalClose () {
    this.clearAlert('modal')
    this.entityModalForm.reset()
  }

  onEntityModalOpen () {
    this.entityModalForm.reset()
  }

  async onModalSubmit () {
    this.clearAlert('modal')

    if (!this.entityModalForm.valid) {
      const missing = Object.keys(this.entityModalForm.controls)
        .map(controlName => {
          const control = this.entityModalForm.get(controlName)
          return control.valid ? null : controlName
        })
        .filter(v => !!v)
        .filter(v => this.modalMode === 'Schema' ? v !== 'schema' : false)
        .join(', ')
        
      this.setAlert(`Invalid value supplied for field(s): ${missing}`, 'error', 'modal')
      Object.keys(this.entityModalForm.controls).forEach(field =>
        this.entityModalForm.get(field)!.markAsDirty()
      )
      return
    }

    const form = this.entityModalForm.value
    let response: BaseResponse
    try {
      response = await firstValueFrom(
        this.historyService.createEntity(form.name, this.modalMode, this.entityModalTemp.schema)
      )
    } catch (e) {
      console.error(e)
      this.setAlert(`Error creating ${this.modalMode}: ${e.toString()}`, 'error', 'modal')
      return
    }

    if (response.success) {
      this.entityModal.hide()
      // Fetch the latest schema
      await this.historyState.getSchemas()
      // Select the newly added table as the current value
      const targets = this.form.get('targets') as FormArray
      const controlTarget = targets.at(this.entityModalTemp.index) as FormGroup
      controlTarget.get(this.modalMode === 'Schema' ? 'schema' : 'table').setValue(form.name)
      // Re-enable the table column
      if (this.modalMode === 'Schema') {
        controlTarget.get('table').enable()
      }
    } else {
      this.setAlert(`Error creating ${this.modalMode}: ${response.message}`, 'error', 'modal')
      return
    }
  }

  isSelectValid (type: 'Schema' | 'Table', index: number) {
    const targets = this.form.get('targets') as FormArray
    const row = targets.at(index) as FormGroup
    const control = type === 'Schema' ? row.get('schema') : row.get('table')
    return control.dirty ? control.valid : true
  }

  onSelectChange (type: 'Schema' | 'Table', event: Event, index: number) {
    const target = (event.target as HTMLSelectElement)
    if (target.value === '+ Create New') {
      this.modalMode = type
      this.entityModal.show()
      target.value = `${type} Name`
    }

    const targets = this.form.get('targets') as FormArray
    const controlTarget = targets.at(index) as FormGroup
    const control = controlTarget.get('table')

    this.entityModalTemp = { index }

    if (type === 'Table') {
      this.entityModalTemp.schema  = controlTarget.get('schema').value
    } else {
      if (!['+ Create New', 'Schema Name'].includes(target.value)) {
        control.enable()
      } else {
        control.setValue('Table Name')
        control.disable()
      }
    }
  }

  clearAlert (alertType: 'modal' | 'form' = 'form') {
    const blankParams: AlertParameters = {
      text: '',
      type: 'info',
      pulse: false
    }
    if (alertType === 'form') {
      this.alertParams = blankParams
    } else if (alertType === 'modal') {
      this.entityModalAlertParams = blankParams
    } else {
      console.error(`Unknown alert type: ${alertType}`)
    }
  }

  setAlert (message: string, alertType: 'info' | 'success' | 'warning' | 'error', type: 'modal' | 'form' = 'form', pulse: boolean = false) {
    if (type === 'form') {
      this.alertParams = {
        type: alertType, text: message, pulse: pulse
      }
    } else if (type === 'modal') {
      this.entityModalAlertParams = {
        type: alertType, text: message, pulse: pulse
      }
    }
  }

  async setStep (num: number) {
    this.clearAlert()
    if (num < 1 || num > 4 || this.stepChangeDisabled) return

    // Step 2
    if (num == 2) {
      // Validate Mongo URI before continuing
      const uri = this.form.get('uri')
      if (!uri?.valid) {
        this.setAlert('Invalid Mongo URI format.', 'error')
        uri?.markAsDirty()
        return
      }
      this.setAlert('Validating Mongo URI, please wait...', 'info', 'form', true)

      this.stepChangeDisabled = true
      let response: { valid: boolean; message?: string; }
      try {
        response = await firstValueFrom(this.historyService.testMongoUri(this.form.value.uri))
      } catch (e) {
        console.error(e)
        this.setAlert('Error validating Mongo URI', 'error')
        this.stepChangeDisabled = false
        return
      }
      this.stepChangeDisabled = false
      this.clearAlert()

      if (!response.valid) {
        this.setAlert(`Unable to validate URI: ${response.message}`, 'error')
        return
      }

      // If the URI has changed, we need to update the structure
      let updateStructure = false
      if (this.historyState.uri !== this.form.value.uri) {
        updateStructure = true
      }

      // Store the URI in the state
      this.historyState.uri = this.form.value.uri      

      // Only fetch the structure if the URI has changed
      if (updateStructure) {
        // Fetch the database structure
        this.historyState.getDatabaseStructure(this.historyState.uri)
      }
    }

    // Step 3
    if (num == 3) {
      // Prevent proceeding without a structure loaded
      if (!this.historyState.structure.length) return
      // Prevent proceeding without a collection selected
      if (!this.checkIfCollectionSelected()) {
        this.setAlert('You must select at least one collection.', 'error')
        return
      }

      
      // Clear out the existing target rows/reference
      // TODO change so this doesn't clear out step->step
      // a clear out should only occur if the structure changes
      this.targets.clear()
      this.targetReference = []

      // Create the dynamic form fields for each collection
      this.historyState.structure.forEach(item => {
        item.children.forEach(child => {
          if (!child.selected) return
          // Add the reference database/collection
          this.targetReference.push({
            database: item.name,
            collection: child.name
          })
          // Add a dynamic row for each collection so we can get it's target
          this.targets.push(
            this.fb.group({
              schema: [
                'Schema Name', 
                [Validators.required, ensureNonDefaultValue]
              ],
              table: [
                { value: 'Table Name', disabled: true }, 
                [Validators.required, ensureNonDefaultValue]
              ]
            })
          )
        })
      })
    }

    // Step 4
    if (num == 4) {
      // Prevent proceeding without a structure loaded
      if (!this.historyState.structure.length) return
      // Prevent proceeding without a collection selected
      if (!this.checkIfCollectionSelected()) {
        this.setAlert('You must select at least one collection.', 'error')
        return
      }

      const credentialsForm = this.form.get('credentials') as FormGroup
      if (!credentialsForm.valid) {
        const missing = Object.keys(credentialsForm.controls)
        .map(controlName => {
          const control = credentialsForm.get(controlName)
          return control.valid ? null : controlName
        })
        .filter(v => !!v)
        .join(', ')
        
        this.setAlert(`Invalid value supplied for field(s): ${missing}`, 'error')
        Object.keys(credentialsForm.controls).forEach(field =>
          credentialsForm.get(field)!.markAsDirty()
        )
        return
      }
      
      let updateRequired = false
      if (this.historyState.credentials.username !== credentialsForm.value.username || 
        this.historyState.credentials.password !== credentialsForm.value.password) {
          updateRequired = true
      }

      this.stepChangeDisabled = true
      if (updateRequired) {
        let response: { username?: string, message?: string }
        try {
          response = await firstValueFrom(this.historyService.validateCredentials({
            username: credentialsForm.value.username,
            password: credentialsForm.value.password
          }))
        } catch (e) {
          console.error(e)
          this.setAlert(`Error validating credentials: ${e.error.error}`, 'error')
          this.stepChangeDisabled = false
          return
        }

        if (response.message) {
          this.setAlert(`Error validating credentials: ${response.message}`, 'error')
          this.stepChangeDisabled = false
          return
        }
      }
      
      // Store the credentials for later
      this.historyState.credentials = credentialsForm.value

      // Pull the HarperDB schema / tables
      await this.historyState.getSchemas()
      this.stepChangeDisabled = false
    }

    this.stepNumber = num
  }

  checkIfCollectionSelected () {
    const items = this.historyState.structure
    // Make sure at least one item is selected
    return items.map(i => i.selected).every(v => v === 'no') ? false : true
  }

  constructor (
    private fb: FormBuilder,
    private title: Title,
    private historyService: HistoryService,
    public historyState: HistoryStateService,
    private router: Router
  ) {
    super(fb)
  }

  ngOnInit(): void {    
    this.title.setTitle('Create New Job' + environment.pageTag)
  }

}
