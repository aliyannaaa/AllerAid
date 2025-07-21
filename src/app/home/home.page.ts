import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastController, AlertController, ModalController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { EmergencyService } from '../service/emergency.service';
import { UserService } from '../service/user.service';
import { BuddyService } from '../service/buddy.service';
import { AuthService } from '../service/auth.service';
import { Subscription } from 'rxjs';
import { AllergyService } from '../service/allergy.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {
  private emergencyResponseSubscription: Subscription | null = null;
  private currentEmergencyId: string | null = null;
  
  // Current user information
  userId: string | null = null;
  userName: string = '';
  userAllergies: any[] = [];
  emergencyInstruction: string = '';
  userBuddies: any[] = [];
  
  // For tracking responding buddy
  respondingBuddy: any = null;

  constructor(
    private alertController: AlertController,
    private router: Router,
    private emergencyService: EmergencyService,
    private userService: UserService,
    private buddyService: BuddyService,
    private authService: AuthService,
    private allergyService: AllergyService,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private toastController: ToastController
  ) {}
  
  ngOnInit() {
    // Load user data when the component initializes
    this.loadUserData();
    
    // Subscribe to emergency responses
    this.subscribeToEmergencyResponses();
  }
  
  ngOnDestroy() {
    // Clean up subscriptions when component is destroyed
    if (this.emergencyResponseSubscription) {
      this.emergencyResponseSubscription.unsubscribe();
    }
    
    // Stop any active location tracking
    this.emergencyService.stopLocationTracking();
  }
  
  async loadUserData() {
    // Wait for auth to be initialized
    const currentUser = await this.authService.waitForAuthInit();
    
    if (currentUser) {
      this.userId = currentUser.uid;
      console.log('Loading user data for:', currentUser.email); // Debug log
      
      // Load user profile
      try {
        const userProfile = await this.userService.getUserProfile(currentUser.uid);
        if (userProfile) {
          this.userName = `${userProfile.firstName} ${userProfile.lastName}`;
          this.emergencyInstruction = userProfile.emergencyInstruction || 'Use EpiPen immediately';
        }
        
        // Load user allergies
        const allergies = await this.allergyService.getUserAllergies(currentUser.uid);
        this.userAllergies = allergies;
        
        // Load buddies
        this.userBuddies = await this.buddyService.getUserBuddies(currentUser.uid);
        console.log('Loaded buddies:', this.userBuddies); // Debug log
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    } else {
      console.log('No current user found in home page - redirecting to login');
      
      // Show toast and redirect to login
      const toast = await this.presentToast('Please log in to access the app');
      
      // Redirect to login page
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1000);
    }
  }
  
  subscribeToEmergencyResponses() {
    this.emergencyResponseSubscription = this.emergencyService.emergencyResponse$.subscribe(
      response => {
        if (response) {
          this.respondingBuddy = response;
          this.showResponderAlert(response);
        }
      }
    );
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
    // Wait for auth to be initialized and get current user
    const currentUser = await this.authService.waitForAuthInit();
    
    if (!currentUser) {
      await this.presentToast('You must be logged in to send an emergency alert');
      return;
    }
    
    if (this.userBuddies.length === 0) {
      await this.presentToast('You need to add buddies to your account first');
      return;
    }
    
    // Show loading indicator
    const loading = await this.loadingController.create({
      message: 'Sending emergency alert...',
      spinner: 'circles'
    });
    await loading.present();
    
    try {
      // Get buddy IDs
      const buddyIds = this.userBuddies.map(buddy => buddy.id);
      
      // Get allergies as string array
      const allergyStrings = this.userAllergies.map(allergy => 
        allergy.label || allergy.name || ''
      ).filter(allergy => allergy !== '');
      
      // Send the emergency alert
      this.currentEmergencyId = await this.emergencyService.sendEmergencyAlert(
        currentUser.uid,
        this.userName,
        buddyIds,
        allergyStrings,
        this.emergencyInstruction
      );
      
      // Dismiss loading indicator
      await loading.dismiss();
      
      // Show success alert
      const alert = await this.alertController.create({
        header: 'Alert Sent!',
        message: `Your emergency alert has been sent to ${this.userBuddies.length} buddies.<br><br>Your location is being shared in real-time.`,
        buttons: ['OK']
      });

      await alert.present();
      
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      
      // Dismiss loading indicator
      await loading.dismiss();
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Failed to send emergency alert. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Could not obtain location') || error.message.includes('timeout')) {
          errorMessage = 'Could not get your location in time. Please check your location settings and try again. In an emergency, call 911 directly.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Location permission denied. Please enable location access in your device settings to send emergency alerts.';
        } else if (error.message.includes('not supported')) {
          errorMessage = 'Location services are not available on this device.';
        }
      }
      
      // Show error alert with helpful message
      const errorAlert = await this.alertController.create({
        header: 'Emergency Alert Failed',
        message: errorMessage,
        buttons: [
          {
            text: 'OK',
            role: 'cancel'
          },
          {
            text: 'Retry',
            handler: () => {
              this.sendEmergencyAlert();
            }
          }
        ]
      });
      
      await errorAlert.present();
    }
  }
  
  async showResponderAlert(response: any) {
    const alert = await this.alertController.create({
      header: 'Help is on the way!',
      message: `${response.responderName || 'A buddy'} is responding to your emergency and is on their way to your location.`,
      buttons: [
        {
          text: 'View Map',
          handler: () => {
            this.openResponderMap(response);
          }
        },
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }
  
  openResponderMap(response: any) {
    // Navigate to a map view showing the responder's location
    this.router.navigate(['/responder-map'], { 
      state: { responder: response } 
    });
  }

  openNotifications() {
    this.router.navigate(['/tabs/notification']);
  }
  
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}
