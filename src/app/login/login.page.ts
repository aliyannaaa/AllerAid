import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ToastController, NavController } from '@ionic/angular';
import { UserService } from '../service/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email: string = '';
  password: string = '';

  constructor(
    private afAuth: AngularFireAuth,
    private toastController: ToastController,
    private navCtrl: NavController,
    private userService: UserService
  ) {}

  async login() {
    if (!this.email || !this.password) {
      this.presentToast('Email and password are required');
      return;
    }

    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(this.email, this.password);
      
      if (userCredential.user) {
        // Update last login timestamp
        await this.userService.updateLastLogin(userCredential.user.uid);
        
        // Check if user needs to complete allergy onboarding
        const userProfile = await this.userService.getUserProfile(userCredential.user.uid);
        if (userProfile) {
          this.presentToast('Login successful');
          this.navCtrl.navigateForward('/tabs/home');
        } else {
          // If no profile exists, redirect to onboarding
          this.navCtrl.navigateForward('/allergy-onboarding');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      this.presentToast(`Login failed: ${error.message}`);
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'medium'
    });
    await toast.present();
  }
}
