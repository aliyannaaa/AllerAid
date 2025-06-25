import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ToastController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.page.html',
  styleUrls: ['./registration.page.scss'],
  standalone: false,
})
export class RegistrationPage {
  firstName = '';
  lastName = '';
  email = '';
  password = '';

  constructor(
    private afAuth: AngularFireAuth,
    private toastController: ToastController,
    private navCtrl: NavController
  ) {}

  async register() {
    if (!this.email || !this.password) {
      this.presentToast('Email and password are required.');
      return;
    }

    try {
      await this.afAuth.createUserWithEmailAndPassword(this.email, this.password);
      this.presentToast('Registration successful! Please log in.');
      this.navCtrl.navigateForward('/login');
    } catch (error: any) {
      this.presentToast(`Registration failed: ${error.message}`);
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'medium',
    });
    toast.present();
  }
}
