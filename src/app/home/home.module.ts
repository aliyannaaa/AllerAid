import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';
import { EmergencyResponseNotificationModule } from '../components/emergency-response-notification/emergency-response-notification.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    EmergencyResponseNotificationModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
