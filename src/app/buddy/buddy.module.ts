import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BuddyPageRoutingModule } from './buddy-routing.module';

import { BuddyPage } from './buddy.page';
import { BuddyModalComponent } from './buddy-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BuddyPageRoutingModule
  ],
  declarations: [BuddyPage, BuddyModalComponent]
})
export class BuddyPageModule {}
