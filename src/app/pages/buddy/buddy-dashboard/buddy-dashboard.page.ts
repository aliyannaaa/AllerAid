import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { BuddyService } from 'src/app/service/buddy.service';
import { EmergencyService } from 'src/app/service/emergency.service';
import { AuthService } from 'src/app/service/auth.service';
import { Subscription } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-buddy-dashboard',
  templateUrl: './buddy-dashboard.page.html',
  styleUrls: ['./buddy-dashboard.page.scss'],
  standalone: false,
})
export class BuddyDashboardPage implements OnInit, OnDestroy {
  hasResponded: boolean = false;
  audio: HTMLAudioElement | null = null;
  
  activeEmergencies: any[] = [];
  currentEmergencyId: string | null = null;
  currentEmergency: any = null;
  
  emergencySubscription: Subscription | null = null;
  
  buddyId: string = '';
  buddyName: string = '';
  
  constructor(
    private buddyService: BuddyService,
    private emergencyService: EmergencyService,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private router: Router
  ) {}
  
  ngOnInit() {
    this.loadUserData();
    
    // Play alert sound on page load
    this.playEmergencySound();
  }
  
  ngOnDestroy() {
    if (this.emergencySubscription) {
      this.emergencySubscription.unsubscribe();
    }
    
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
  }
  
  async loadUserData() {
    // Wait for auth to be initialized
    const currentUser = await this.authService.waitForAuthInit();
    
    if (currentUser) {
      this.buddyId = currentUser.uid;
      console.log('Loading buddy dashboard for:', currentUser.email); // Debug log
      
      // Get buddy name
      const buddyDoc = await this.buddyService.getBuddyById(this.buddyId);
      if (buddyDoc) {
        this.buddyName = `${buddyDoc.firstName} ${buddyDoc.lastName}`;
      }
      
      // Start listening for emergency alerts
      this.listenForEmergencies();
    } else {
      console.log('No authenticated user found in buddy dashboard');
      // Could redirect to login here if needed
    }
  }
  
  listenForEmergencies() {
    this.buddyService.listenForEmergencyAlerts(this.buddyId);
    
    this.emergencySubscription = this.buddyService.activeEmergencyAlerts$.subscribe(
      emergencies => {
        this.activeEmergencies = emergencies;
        
        // If we have a new emergency and we're not already responding
        if (emergencies.length > 0 && !this.hasResponded) {
          const latestEmergency = emergencies[0];
          this.currentEmergency = latestEmergency;
          this.currentEmergencyId = latestEmergency.id;
          
          // Play sound if this is a new emergency
          if (this.currentEmergencyId !== this.currentEmergencyId) {
            this.playEmergencySound();
          }
        }
      }
    );
  }

  async responded() {
    if (!this.hasResponded && this.currentEmergencyId) {
      // Show loading indicator
      const loading = await this.loadingController.create({
        message: 'Sending response...',
      });
      await loading.present();
      
      try {
        // First check location permissions
        await Geolocation.requestPermissions();
        
        // Mark as responding in the database
        await this.buddyService.respondToEmergency(
          this.currentEmergencyId,
          this.buddyId,
          this.buddyName
        );
        
        this.hasResponded = true;
        
        // Start tracking location for the emergency
        this.emergencyService.startResponderLocationTracking(
          this.currentEmergencyId,
          this.buddyId
        );
        
        await loading.dismiss();
        
        // Show success toast
        const toast = await this.toastController.create({
          message: 'You are now responding to this emergency.',
          duration: 2000,
          color: 'success',
        });
        await toast.present();
        
      } catch (error) {
        console.error('Error responding to emergency:', error);
        
        await loading.dismiss();
        
        // Show error toast
        const toast = await this.toastController.create({
          message: 'Failed to respond to emergency. Please try again.',
          duration: 3000,
          color: 'danger',
        });
        await toast.present();
      }
    }
  }

  async cannotRespond() {
    const alert = await this.alertController.create({
      header: 'Unable to Respond',
      message: 'Are you sure you cannot respond to this emergency?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Confirm',
          handler: () => {
            // Just mark locally that we can't respond
            // We don't update the database as we're not actually declining
            this.presentToast('You have declined to respond.');
            this.router.navigate(['/tabs/home']);
          }
        }
      ]
    });
    
    await alert.present();
  }

  navigate() {
    if (!this.currentEmergency || !this.currentEmergency.location) {
      this.presentToast('Location information is not available.');
      return;
    }
    
    const { latitude, longitude } = this.currentEmergency.location;
    const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(mapUrl, '_blank');
  }

  async markResolved() {
    if (!this.currentEmergencyId) return;
    
    const alert = await this.alertController.create({
      header: 'Resolve Emergency',
      message: 'Are you sure the emergency has been resolved?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Yes, Resolved',
          handler: async () => {
            try {
              await this.emergencyService.resolveEmergency(this.currentEmergencyId!);
              this.hasResponded = false;
              this.currentEmergencyId = null;
              this.currentEmergency = null;
              
              const toast = await this.toastController.create({
                message: 'Emergency marked as resolved.',
                duration: 2000,
                color: 'success',
              });
              await toast.present();
              
              // Navigate back to home
              this.router.navigate(['/tabs/home']);
              
            } catch (error) {
              console.error('Error resolving emergency:', error);
              this.presentToast('Failed to resolve emergency. Please try again.');
            }
          }
        }
      ]
    });
    
    await alert.present();
  }

  playEmergencySound() {
    const voiceURL = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.audio = new Audio(voiceURL);
    this.audio.loop = true;
    this.audio.play();
  }

  speakAlert() {
    if (!this.currentEmergency) return;
    
    // Build the message from the emergency info
    let message = `Emergency from ${this.currentEmergency.userName || 'a user'}. `;
    
    if (this.currentEmergency.allergies && this.currentEmergency.allergies.length > 0) {
      message += `Allergies: ${this.currentEmergency.allergies.join(', ')}. `;
    }
    
    if (this.currentEmergency.instruction) {
      message += `Instructions: ${this.currentEmergency.instruction}. `;
    }
    
    const utterance = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(utterance);
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