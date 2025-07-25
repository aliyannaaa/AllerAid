import { Component } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { MedicationService, Medication } from '../service/medication.service';

@Component({
  selector: 'app-add-medication',
  templateUrl: './add-medication.modal.html',
  styleUrls: ['./add-medication.modal.scss'],
  standalone: false,
})
export class AddMedicationModal {
  med: Medication = {
    name: '',
    dosage: '',
    frequency: '', // Duration like "10 days"
    quantity: 0, // Number of pills
    startDate: new Date().toISOString(),
    notes: '',
    category: 'other',
    isActive: true
  };

  constructor(
    private modalCtrl: ModalController,
    private medService: MedicationService,
    private toastController: ToastController
  ) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async saveMedication() {
    if (!this.med.name.trim()) {
      this.presentToast('Please enter medication name');
      return;
    }

    if (!this.med.dosage.trim()) {
      this.presentToast('Please enter dosage');
      return;
    }

    if (!this.med.quantity || this.med.quantity <= 0) {
      this.presentToast('Please enter number of pills');
      return;
    }

    if (!this.med.frequency.trim()) {
      this.presentToast('Please enter duration');
      return;
    }

    try {
      // Set additional metadata
      this.med.createdAt = new Date();
      this.med.updatedAt = new Date();
      
      await this.medService.addMedication(this.med);
      this.presentToast('Medication added successfully');
      this.modalCtrl.dismiss({ saved: true });
    } catch (error) {
      console.error('Error saving medication:', error);
      this.presentToast('Error saving medication');
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
