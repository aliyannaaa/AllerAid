import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProfilePageRoutingModule } from './profile-routing.module';

import { ProfilePage } from './profile.page';
import { AddMedicationModal } from '../modals/add-medication.modal';
import { AddDoctorVisitModal } from '../modals/add-doctor-visit.modal';
import { AddMedicalHistoryModal } from '../modals/add-medical-history.modal';
import { AddEmergencyContactModal } from '../modals/add-emergency-contact.modal';
import { ImageViewerModal } from '../modals/image-viewer.modal';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProfilePageRoutingModule
  ],
  declarations: [ProfilePage, AddMedicationModal, AddDoctorVisitModal, AddMedicalHistoryModal, AddEmergencyContactModal, ImageViewerModal],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProfilePageModule {}
