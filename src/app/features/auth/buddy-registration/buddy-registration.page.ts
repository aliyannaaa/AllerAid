import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { BuddyService, BuddyInvitation } from '../../../core/services/buddy.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-buddy-registration',
  templateUrl: './buddy-registration.page.html',
  styleUrls: ['./buddy-registration.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class BuddyRegistrationPage implements OnInit {
  registrationData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  };

  acceptTerms: boolean = false;
  isLoading: boolean = false;
  invitationDetails: BuddyInvitation | null = null;
  invitationId: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private userService: UserService,
    private buddyService: BuddyService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) { }

  async ngOnInit() {
    // Get invitation ID from route params or query params
    this.invitationId = this.route.snapshot.queryParamMap.get('invitationId') || '';
    
    if (this.invitationId) {
      await this.loadInvitationDetails();
    }
  }

  private async loadInvitationDetails() {
    try {
      // Load invitation details to show who invited them
      // This would require a method in buddy service to get invitation by ID
      this.registrationData.email = 'example@email.com'; // From invitation
    } catch (error) {
      console.error('Error loading invitation details:', error);
    }
  }

  async register() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Creating your buddy account...'
    });
    await loading.present();

    try {
      // 1. Create Firebase Auth user
      const userCredential = await this.authService.signUp(
        this.registrationData.email,
        this.registrationData.password
      );

      // 2. Create buddy profile
      await this.userService.createBuddyProfile(
        userCredential.user.uid,
        this.registrationData.email,
        this.registrationData.firstName,
        this.registrationData.lastName,
        this.registrationData.phone
      );

      // 3. Accept the buddy invitation automatically
      if (this.invitationId) {
        await this.buddyService.acceptBuddyInvitation(this.invitationId);
      }

      await loading.dismiss();
      
      const toast = await this.toastController.create({
        message: 'Buddy account created successfully! Welcome to AllerAid.',
        duration: 3000,
        color: 'success'
      });
      await toast.present();

      // Navigate to buddy dashboard
      this.router.navigate(['/tabs/responder-dashboard']);

    } catch (error) {
      await loading.dismiss();
      console.error('Registration error:', error);
      
      const toast = await this.toastController.create({
        message: 'Registration failed. Please try again.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }

    this.isLoading = false;
  }

  private validateForm(): boolean {
    if (!this.registrationData.firstName || !this.registrationData.lastName || 
        !this.registrationData.email || !this.registrationData.phone || 
        !this.registrationData.password) {
      this.showToast('Please fill in all required fields.');
      return false;
    }

    if (this.registrationData.password !== this.registrationData.confirmPassword) {
      this.showToast('Passwords do not match.');
      return false;
    }

    if (this.registrationData.password.length < 6) {
      this.showToast('Password must be at least 6 characters long.');
      return false;
    }

    if (!this.acceptTerms) {
      this.showToast('Please accept the terms and conditions.');
      return false;
    }

    return true;
  }

  async declineInvitation() {
    if (this.invitationId) {
      try {
        await this.buddyService.declineBuddyInvitation(this.invitationId);
        const toast = await this.toastController.create({
          message: 'Invitation declined.',
          duration: 2000,
          color: 'medium'
        });
        await toast.present();
      } catch (error) {
        console.error('Error declining invitation:', error);
      }
    }
    
    // Navigate away or close
    this.router.navigate(['/login']);
  }

  showTerms() {
    // Show terms modal or navigate to terms page
  }

  showPrivacy() {
    // Show privacy modal or navigate to privacy page
  }

  private async showToast(message: string, color: string = 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color
    });
    await toast.present();
  }
}
