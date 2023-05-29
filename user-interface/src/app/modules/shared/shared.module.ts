import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { SpinnerComponent } from './spinner.component';
import { AlertComponent } from './alert/alert.component';
import { TreeViewComponent } from './tree-view/tree-view.component';
import { ModalComponent } from './modal/modal.component';

@NgModule({
  declarations: [
    NavbarComponent,
    SpinnerComponent,
    AlertComponent,
    TreeViewComponent,
    ModalComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    NavbarComponent,
    SpinnerComponent,
    AlertComponent,
    TreeViewComponent,
    ModalComponent
  ]
})
export class SharedModule { }
