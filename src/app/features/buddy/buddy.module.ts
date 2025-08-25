import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BuddyPageRoutingModule } from './buddy-routing.module';

import { BuddyPage } from './pages/buddy.page';
import { 
  BuddyModalComponent,
  BuddyActionsModalComponent,
  BuddyEditModalComponent,
  BuddyDeleteConfirmModalComponent 
} from './components';

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
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class BuddyPageModule {}




