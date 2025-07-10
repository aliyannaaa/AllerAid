import { Component } from '@angular/core';
import { ToastController, NavController } from '@ionic/angular';
import { UserService } from '../service/user.service';
import { AuthService } from '../service/auth.service';

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
  role = '';

  constructor(
    private toastController: ToastController,
    private navCtrl: NavController,
    private userService: UserService,
    private authService: AuthService
  ) {}

  async register() {
    if (!this.email || !this.password || !this.firstName || !this.lastName || !this.role) {
      this.presentToast('All fields are required.');
      return;
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await this.authService.signUp(this.email, this.password);
      
      if (userCredential.user) {
        console.log('User created in Firebase Auth:', userCredential.user.uid);
        
        // Create user profile in Firestore
        await this.userService.createUserProfile(userCredential.user.uid, {
          email: this.email,
          firstName: this.firstName,
          lastName: this.lastName,
          role: this.role
        });
        
        console.log('User profile created in Firestore');
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
