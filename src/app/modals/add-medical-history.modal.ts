import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { EHRService, MedicalHistory } from '../service/ehr.service';

@Component({
  selector: 'app-add-medical-history',
  templateUrl: './add-medical-history.modal.html',
  styleUrls: ['./add-medical-history.modal.scss'],
  standalone: false,
})
export class AddMedicalHistoryModal implements OnInit {
  @Input() history?: MedicalHistory;
  
  currentDate: string = new Date().toISOString();
  historyData: Omit<MedicalHistory, 'id' | 'patientId'> = {
    condition: '',
    diagnosisDate: new Date().toISOString(),
    status: 'active',
    notes: ''
  };

  isEditMode = false;

  statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'chronic', label: 'Chronic' }
  ];

  commonConditions = [
    'Diabetes',
    'Hypertension',
    'Asthma',
    'Allergies',
    'Depression',
    'Anxiety',
    'High Cholesterol',
    'Arthritis',
    'COPD',
    'Heart Disease',
    'Migraines',
    'Thyroid Disorder',
    'Gastroesophageal Reflux Disease (GERD)',
    'Sleep Apnea',
    'Osteoporosis'
  ];

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private ehrService: EHRService
  ) {}

  ngOnInit() {
    if (this.history) {
      this.isEditMode = true;
      this.historyData = {
        condition: this.history.condition,
        diagnosisDate: this.history.diagnosisDate,
        status: this.history.status,
        notes: this.history.notes || ''
      };
    }
  }

  selectCondition(condition: string) {
    this.historyData.condition = condition;
  }

  async saveHistory() {
    try {
      if (!this.historyData.condition.trim()) {
        await this.showToast('Please enter a medical condition', 'warning');
        return;
      }

      if (this.isEditMode && this.history?.id) {
        await this.ehrService.updateMedicalHistory(this.history.id, this.historyData);
        await this.showToast('Medical history updated successfully', 'success');
      } else {
        await this.ehrService.addMedicalHistory(this.historyData);
        await this.showToast('Medical history added successfully', 'success');
      }

      this.modalController.dismiss(true);
    } catch (error) {
      console.error('Error saving medical history:', error);
      await this.showToast('Error saving medical history', 'danger');
    }
  }

  async deleteHistory() {
    if (this.history?.id) {
      try {
        await this.ehrService.deleteMedicalHistory(this.history.id);
        await this.showToast('Medical history deleted successfully', 'success');
        this.modalController.dismiss(true);
      } catch (error) {
        console.error('Error deleting medical history:', error);
        await this.showToast('Error deleting medical history', 'danger');
      }
    }
  }

  cancel() {
    this.modalController.dismiss();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
