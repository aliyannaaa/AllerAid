import { Component } from '@angular/core';
import { FirebaseService } from '../service/firebase.service';
import { ToastController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage {

  buddyFirstName = '';
  buddyLastName = '';

  constructor(
    private firebaseService: FirebaseService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  async addBuddy() {
    const buddy = {
      firstName: this.buddyFirstName,
      lastName: this.buddyLastName
    };

    try {
      const id = await this.firebaseService.addBuddy(buddy);
      console.log('Buddy added with ID:', id);
      this.buddyFirstName = '';
      this.buddyLastName = '';

      const toast = await this.toastController.create({
        message: 'Buddy added successfully!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

    } catch (error) {
      console.error('Error adding buddy:', error);
      const toast = await this.toastController.create({
        message: 'Failed to add buddy.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  triggerEmergency() {
    this.presentEmergencyConfirmation();
  }

  async presentEmergencyConfirmation() {
    const alert = await this.alertController.create({
      header: 'EMERGENCY ALERT!',
      message: 'Your emergency alert is about to be sent. Are you sure?',
      buttons: [
        {
          text: 'SEND ALERT',
          handler: () => {
            this.sendEmergencyAlert();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  async sendEmergencyAlert() {
    const alert = await this.alertController.create({
      header: 'Alert Sent!',
      message: `Your emergency alert has been sent to:<br><strong>The Emergency Services<br>Buddies</strong><br><br>Your location is being shared in real-time.`,
      buttons: ['OK']
    });

    await alert.present();

    // TODO: Add your actual emergency logic (Firebase, SMS, location, etc.)
  }
}
