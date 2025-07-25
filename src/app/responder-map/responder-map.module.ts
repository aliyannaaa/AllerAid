import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ResponderMapPageRoutingModule } from './responder-map-routing.module';

import { ResponderMapPage } from './responder-map.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ResponderMapPageRoutingModule
  ],
  declarations: [ResponderMapPage]
})
export class ResponderMapPageModule {}
