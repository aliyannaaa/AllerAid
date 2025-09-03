import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BuddyService } from '../../../core/services/buddy.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { EmergencyService, EmergencyAlert } from '../../../core/services/emergency.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-responder-dashboard',
  templateUrl: './responder-dashboard.page.html',
  styleUrls: ['./responder-dashboard.page.scss'],
  standalone: false,
})
export class ResponderDashboardPage implements OnInit, OnDestroy {
  hasResponded: boolean = false;
  audio: HTMLAudioElement | null = null;
  activeEmergencies: EmergencyAlert[] = [];
  currentEmergency: EmergencyAlert | null = null;
  private emergencySubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private buddyService: BuddyService,
    private authService: AuthService,
    private userService: UserService,
    private emergencyService: EmergencyService
  ) {}

  async ngOnInit() {
    await this.setupRealTimeListeners();
  }

  ngOnDestroy() {
    if (this.emergencySubscription) {
      this.emergencySubscription.unsubscribe();
    }
  }

  private async setupRealTimeListeners() {
    try {
      const user = await this.authService.waitForAuthInit();
      if (user) {
        // Start listening for emergency alerts for this buddy
        this.buddyService.listenForEmergencyAlerts(user.uid);
        
        // Subscribe to emergency alerts
        this.emergencySubscription = this.buddyService.activeEmergencyAlerts$.subscribe(alerts => {
          this.activeEmergencies = alerts.filter(alert => alert.status === 'active');
          
          // Set current emergency to the most recent active one
          if (this.activeEmergencies.length > 0) {
            this.currentEmergency = this.activeEmergencies[0];
            this.playEmergencyNotificationSound();
          } else {
            this.currentEmergency = null;
          }
        });
      }
    } catch (error) {
      console.error('Error setting up real-time listeners:', error);
    }
  }

  private playEmergencyNotificationSound() {
    try {
      // Play notification sound for new emergency
      const audio = new Audio('assets/sounds/emergency-alert.wav');
      audio.play().catch(e => console.log('Could not play audio:', e));
      
      // Vibrate if available
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch (error) {
      console.error('Error playing emergency notification:', error);
    }
  }

  async responded() {
    if (!this.hasResponded && this.currentEmergency) {
      try {
        const user = await this.authService.waitForAuthInit();
        if (user && this.currentEmergency.id) {
          // Get current user profile for name
          const userProfile = await this.userService.getUserProfile(user.uid);
          const buddyName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Buddy';
          
          // Respond to emergency with ETA calculation
          await this.emergencyService.respondToEmergency(
            this.currentEmergency.id, 
            user.uid, 
            buddyName
          );
          
          this.hasResponded = true;
          console.log('Buddy marked as responded with ETA calculation');
          
          // Navigate to map for directions
          this.navigate();
        }
      } catch (error) {
        console.error('Error responding to emergency:', error);
      }
    }
  }

  cannotRespond() {
    if (this.currentEmergency) {
      // Mark as unable to respond
      this.hasResponded = false;
      console.log('User cannot respond to the emergency.');
    }
  }

  navigate() {
    if (this.currentEmergency && this.currentEmergency.location) {
      // Navigate to responder map page with emergency details
      this.router.navigate(['/tabs/responder-map'], {
        queryParams: {
          emergencyId: this.currentEmergency.id,
          userId: this.currentEmergency.userId,
          lat: this.currentEmergency.location.latitude,
          lng: this.currentEmergency.location.longitude
        }
      });
    } else {
      // Fallback to Google Maps
      const mapUrl = 'https://www.google.com/maps?q=123+Main+St,+Makati+City';
      window.open(mapUrl, '_blank');
    }
    console.log('Navigation opened for emergency:', this.currentEmergency?.id);
  }

  markResolved() {
    alert('Emergency marked as resolved.');
    this.hasResponded = false;
    console.log('Emergency resolved.');
  }

  playVoiceMessage() {
    const voiceURL = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.audio = new Audio(voiceURL);
    this.audio.play();
    console.log('Playing voice message:', voiceURL);
  }

  speakAlert() {
    const message = new SpeechSynthesisUtterance(
      'Emergency from Juan Dela Cruz. Severe asthma attack. Location: 123 Main Street, Makati City. Bring inhaler, allergic to nuts.'
    );
    window.speechSynthesis.speak(message);
    console.log('Speaking emergency alert.');
  }
}




