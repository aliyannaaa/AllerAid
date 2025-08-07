import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { EHRService, EmergencyContact } from '../service/ehr.service';

@Component({
  selector: 'app-add-emergency-contact',
  templateUrl: './add-emergency-contact.modal.html',
  styleUrls: ['./add-emergency-contact.modal.scss'],
  standalone: false,
})
export class AddEmergencyContactModal implements OnInit {
  @Input() contact?: EmergencyContact;
  
  contactData: Omit<EmergencyContact, 'id' | 'patientId'> = {
    name: '',
    relationship: '',
    phoneNumber: '',
    email: '',
    isPrimary: false,
    address: ''
  };

  isEditMode = false;

  relationshipOptions = [
    'Spouse',
    'Parent',
    'Child',
    'Sibling',
    'Friend',
    'Doctor',
    'Caregiver',
    'Guardian',
    'Other Family Member',
    'Neighbor',
    'Coworker'
  ];

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private ehrService: EHRService
  ) {}

  ngOnInit() {
    if (this.contact) {
      this.isEditMode = true;
      this.contactData = {
        name: this.contact.name,
        relationship: this.contact.relationship,
        phoneNumber: this.contact.phoneNumber,
        email: this.contact.email || '',
        isPrimary: this.contact.isPrimary,
        address: this.contact.address || ''
      };
    }
  }

  selectRelationship(relationship: string) {
    this.contactData.relationship = relationship;
  }

  formatPhoneNumber(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.length >= 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    } else if (value.length >= 3) {
      value = value.replace(/(\d{3})(\d{0,3})/, '($1) $2');
    }
    
    this.contactData.phoneNumber = value;
  }

  async saveContact() {
    try {
      if (!this.contactData.name.trim()) {
        await this.showToast('Please enter a contact name', 'warning');
        return;
      }

      if (!this.contactData.phoneNumber.trim()) {
        await this.showToast('Please enter a phone number', 'warning');
        return;
      }

      if (!this.contactData.relationship.trim()) {
        await this.showToast('Please specify the relationship', 'warning');
        return;
      }

      // Validate phone number format
      const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
      if (!phoneRegex.test(this.contactData.phoneNumber)) {
        await this.showToast('Please enter a valid phone number format: (123) 456-7890', 'warning');
        return;
      }

      // Validate email if provided
      if (this.contactData.email && this.contactData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.contactData.email)) {
          await this.showToast('Please enter a valid email address', 'warning');
          return;
        }
      }

      if (this.isEditMode && this.contact?.id) {
        await this.ehrService.updateEmergencyContact(this.contact.id, this.contactData);
        await this.showToast('Emergency contact updated successfully', 'success');
      } else {
        await this.ehrService.addEmergencyContact(this.contactData);
        await this.showToast('Emergency contact added successfully', 'success');
      }

      this.modalController.dismiss(true);
    } catch (error) {
      console.error('Error saving emergency contact:', error);
      await this.showToast('Error saving emergency contact', 'danger');
    }
  }

  async deleteContact() {
    if (this.contact?.id) {
      try {
        await this.ehrService.deleteEmergencyContact(this.contact.id);
        await this.showToast('Emergency contact deleted successfully', 'success');
        this.modalController.dismiss(true);
      } catch (error) {
        console.error('Error deleting emergency contact:', error);
        await this.showToast('Error deleting emergency contact', 'danger');
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
