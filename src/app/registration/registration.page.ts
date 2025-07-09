import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ToastController, NavController } from '@ionic/angular';
import { UserService } from '../service/user.service';

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
    private navCtrl: NavController,
    private userService: UserService
  ) {}

  async register() {
    if (!this.email || !this.password || !this.firstName || !this.lastName) {
      this.presentToast('All fields are required.');
      return;
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await this.afAuth.createUserWithEmailAndPassword(this.email, this.password);
      
      if (userCredential.user) {
        // Create user profile in Firestore
        await this.userService.createUserProfile(userCredential.user.uid, {
          email: this.email,
          firstName: this.firstName,
          lastName: this.lastName
        });
        
        this.presentToast('Registration successful! Please log in.');
        this.navCtrl.navigateForward('/login');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
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
