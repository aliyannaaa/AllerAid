import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { BuddyRegistrationPageRoutingModule } from './buddy-registration-routing.module';
import { BuddyRegistrationPage } from './buddy-registration.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BuddyRegistrationPageRoutingModule,
    BuddyRegistrationPage
  ]
})
export class BuddyRegistrationPageModule {}
