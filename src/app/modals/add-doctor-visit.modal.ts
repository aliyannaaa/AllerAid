import { Component } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { EHRService, DoctorVisit } from '../service/ehr.service';

@Component({
  selector: 'app-add-doctor-visit',
  templateUrl: './add-doctor-visit.modal.html',
  styleUrls: ['./add-doctor-visit.modal.scss'],
  standalone: false,
})
export class AddDoctorVisitModal {
  visit: Omit<DoctorVisit, 'id' | 'patientId'> = {
    doctorName: '',
    specialty: '',
    visitDate: new Date().toISOString(),
    visitType: 'routine',
    chiefComplaint: '',
    diagnosis: '',
    treatment: '',
    recommendations: '',
    nextAppointment: '',
    prescriptions: [],
    vitalSigns: {
      bloodPressure: '',
      heartRate: undefined,
      temperature: undefined,
      weight: undefined,
      height: undefined
    },
    notes: ''
  };

  visitTypes = [
    { value: 'routine', label: 'Routine Check-up' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'consultation', label: 'Consultation' }
  ];

  specialties = [
    'General Medicine',
    'Allergy & Immunology',
    'Cardiology',
    'Dermatology',
    'Emergency Medicine',
    'Endocrinology',
    'Family Medicine',
    'Internal Medicine',
    'Neurology',
    'Pediatrics',
    'Pulmonology',
    'Other'
  ];

  newPrescription = '';

  constructor(
    private modalCtrl: ModalController,
    private ehrService: EHRService,
    private toastController: ToastController
  ) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async saveVisit() {
    if (!this.visit.doctorName.trim()) {
      this.presentToast('Please enter doctor name');
      return;
    }

    if (!this.visit.visitDate) {
      this.presentToast('Please select visit date');
      return;
    }

    if (!this.visit.chiefComplaint.trim()) {
      this.presentToast('Please enter chief complaint');
      return;
    }

    try {
      await this.ehrService.addDoctorVisit(this.visit);
      this.presentToast('Doctor visit added successfully');
      this.modalCtrl.dismiss({ saved: true });
    } catch (error) {
      console.error('Error saving doctor visit:', error);
      this.presentToast('Error saving doctor visit');
    }
  }

  addPrescription() {
    if (this.newPrescription.trim()) {
      if (!this.visit.prescriptions) {
        this.visit.prescriptions = [];
      }
      this.visit.prescriptions.push(this.newPrescription.trim());
      this.newPrescription = '';
    }
  }

  removePrescription(index: number) {
    if (this.visit.prescriptions) {
      this.visit.prescriptions.splice(index, 1);
    }
  }

  private async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom'
    });
    toast.present();
  }
}
