import { Component, OnInit } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { UserService } from '../service/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  userName: string = '';

  constructor(
    private alertController: AlertController,
    private router: Router,
    private userService: UserService
  ) {}

  async ngOnInit() {
    const userProfile = await this.userService.getCurrentUserProfile();
    this.userName = userProfile?.firstName || '';
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

  }

  openNotifications() {
    this.router.navigate(['/tabs/notification']);
  }
}
