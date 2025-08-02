import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { EHRService, DoctorVisit } from '../service/ehr.service';

@Component({
  selector: 'app-add-doctor-visit',
  templateUrl: './add-doctor-visit.modal.html',
  styleUrls: ['./add-doctor-visit.modal.scss'],
  standalone: false,
})
export class AddDoctorVisitModal implements OnInit {
  @Input() visit?: DoctorVisit;
  
  visitData: Omit<DoctorVisit, 'id' | 'patientId'> = {
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

  isEditMode = false;

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

  ngOnInit() {
    // If editing an existing visit, populate the form
    if (this.visit) {
      this.isEditMode = true;
      this.visitData = {
        doctorName: this.visit.doctorName,
        specialty: this.visit.specialty,
        visitDate: this.visit.visitDate,
        visitType: this.visit.visitType,
        chiefComplaint: this.visit.chiefComplaint,
        diagnosis: this.visit.diagnosis,
        treatment: this.visit.treatment,
        recommendations: this.visit.recommendations,
        nextAppointment: this.visit.nextAppointment,
        prescriptions: [...(this.visit.prescriptions || [])],
        vitalSigns: { ...this.visit.vitalSigns },
        notes: this.visit.notes || ''
      };
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async saveVisit() {
    if (!this.visitData.doctorName.trim()) {
      this.presentToast('Please enter doctor name');
      return;
    }

    if (!this.visitData.visitDate) {
      this.presentToast('Please select visit date');
      return;
    }

    if (!this.visitData.chiefComplaint.trim()) {
      this.presentToast('Please enter chief complaint');
      return;
    }

    try {
      console.log('Attempting to save visit data:', this.visitData);
      
      if (this.isEditMode && this.visit?.id) {
        // Update existing visit
        console.log('Updating existing visit with ID:', this.visit.id);
        await this.ehrService.updateDoctorVisit(this.visit.id, this.visitData);
        this.presentToast('Doctor visit updated successfully');
      } else {
        // Add new visit
        console.log('Adding new visit');
        await this.ehrService.addDoctorVisit(this.visitData);
        this.presentToast('Doctor visit added successfully');
      }
      this.modalCtrl.dismiss({ saved: true });
    } catch (error) {
      console.error('Detailed error saving doctor visit:', error);
      let errorMessage = 'Error saving doctor visit';
      
      if (error instanceof Error) {
        errorMessage += ': ' + error.message;
      }
      
      this.presentToast(errorMessage);
    }
  }

  addPrescription() {
    if (this.newPrescription.trim()) {
      if (!this.visitData.prescriptions) {
        this.visitData.prescriptions = [];
      }
      this.visitData.prescriptions.push(this.newPrescription.trim());
      this.newPrescription = '';
    }
  }

  removePrescription(index: number) {
    if (this.visitData.prescriptions) {
      this.visitData.prescriptions.splice(index, 1);
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
