import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BuddyPageRoutingModule } from './buddy-routing.module';

import { BuddyPage } from './buddy.page';
import { BuddyModalComponent } from './buddy-modal.component';
import { BuddyActionsModalComponent } from './buddy-actions-modal.component';
import { BuddyEditModalComponent } from './buddy-edit-modal.component';
import { BuddyDeleteConfirmModalComponent } from './buddy-delete-confirm-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BuddyPageRoutingModule
  ],
  declarations: [
    BuddyPage,
    BuddyModalComponent,
    BuddyActionsModalComponent,
    BuddyEditModalComponent,
    BuddyDeleteConfirmModalComponent
  ]
})
export class BuddyPageModule {}
