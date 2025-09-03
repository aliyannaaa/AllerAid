import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BuddyService } from '../../../../core/services/buddy.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EmergencyService, EmergencyAlert } from '../../../../core/services/emergency.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface Patient {
  id: string;
  fullName: string;
  relationship: string;
  avatar?: string;
  lastSeen: Date;
}

interface Emergency {
  id: string;
  patientName: string;
  location: string;
  timestamp: Date;
  status: string;
}

interface Alert {
  id: string;
  patientName: string;
  type: string;
  timestamp: Date;
  status: string;
}

@Component({
  selector: 'app-buddy-dashboard',
  templateUrl: './buddy-dashboard.page.html',
  styleUrls: ['./buddy-dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class BuddyDashboardPage implements OnInit, OnDestroy {
  patients: Patient[] = [];
  activeEmergencies: EmergencyAlert[] = [];
  recentAlerts: Alert[] = [];
  private emergencySubscription: Subscription | null = null;
  private previousEmergencyCount: number = 0;
  invitationCount: number = 0;

  constructor(
    private router: Router,
    private buddyService: BuddyService,
    private authService: AuthService,
    private emergencyService: EmergencyService
  ) { }

  async ngOnInit() {
    await this.loadDashboardData();
    await this.setupRealTimeListeners();
  }

  ngOnDestroy() {
    if (this.emergencySubscription) {
      this.emergencySubscription.unsubscribe();
    }
  }

  private async loadDashboardData() {
    try {
      const user = await this.authService.waitForAuthInit();
      if (user) {
        await Promise.all([
          this.loadPatients(user.uid),
          this.loadRecentAlerts(user.uid),
          this.loadInvitationCount(user.uid)
        ]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  private async setupRealTimeListeners() {
    try {
      const user = await this.authService.waitForAuthInit();
      if (user) {
        // Start listening for emergency alerts for this buddy
        this.buddyService.listenForEmergencyAlerts(user.uid);
        
        // Subscribe to the emergency alerts observable
        this.emergencySubscription = this.buddyService.activeEmergencyAlerts$.subscribe(emergencies => {
          // Check if we have new emergencies to play notification sound
          const newEmergencyCount = emergencies.filter(e => e.status === 'active').length;
          if (newEmergencyCount > this.previousEmergencyCount && this.previousEmergencyCount >= 0) {
            this.playEmergencyNotificationSound();
          }
          this.previousEmergencyCount = newEmergencyCount;
          
          this.activeEmergencies = emergencies;
          console.log('Active emergencies updated:', this.activeEmergencies);
        });
      }
    } catch (error) {
      console.error('Error setting up real-time listeners:', error);
    }
  }

  private playEmergencyNotificationSound() {
    try {
      // Play emergency notification sound
      const audio = new Audio('assets/audio/emergency-alert.mp3');
      audio.play().catch(error => {
        console.log('Could not play notification sound:', error);
      });
      
      // Add vibration for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  }

  private async loadInvitationCount(buddyUserId: string) {
    try {
      const invitations = await this.buddyService.getReceivedInvitations(buddyUserId);
      this.invitationCount = invitations.filter(inv => inv.status === 'pending').length;
    } catch (error) {
      console.error('Error loading invitation count:', error);
      this.invitationCount = 0;
    }
  }

  private async loadPatients(buddyUserId: string) {
    // Load patients this buddy is monitoring
    // This would be patients who have accepted this user as a buddy
    this.patients = []; // Will implement with buddy relations
  }

  private async loadRecentAlerts(buddyUserId: string) {
    // Load recent emergency alerts
    this.recentAlerts = [];
  }

  async refreshDashboard() {
    await this.loadDashboardData();
  }

  async respondToEmergency(emergency: EmergencyAlert) {
    try {
      const user = await this.authService.waitForAuthInit();
      if (user) {
        // Use the emergency service's respond method which includes location tracking and ETA calculation
        await this.emergencyService.respondToEmergency(
          emergency.id!, 
          user.uid, 
          user.displayName || 'Buddy Response'
        );
        
        // Navigate to map view with emergency location
        this.router.navigate(['/responder-map'], { 
          state: { 
            responder: {
              emergencyId: emergency.id,
              responderName: user.displayName || 'Buddy Response'
            }
          }
        });
      }
    } catch (error) {
      console.error('Error responding to emergency:', error);
    }
  }

  viewPatientDetails(patient: Patient) {
    // Navigate to patient details page
    this.router.navigate(['/tabs/patients', patient.id]);
  }

  quickCall(patient: Patient, event: Event) {
    event.stopPropagation();
    // Trigger phone call to patient
    window.open(`tel:${patient.relationship}`, '_system');
  }

  checkInvitations() {
    this.router.navigate(['/tabs/buddy']);
  }

  viewEmergencyHistory() {
    this.router.navigate(['/tabs/emergencies']);
  }

  getStatusColor(lastSeen: Date): string {
    const now = new Date();
    const diffHours = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'success';
    if (diffHours < 24) return 'warning';
    return 'medium';
  }

  getLastSeenText(lastSeen: Date): string {
    const now = new Date();
    const diffHours = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'Active';
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  }

  getLocationDisplay(location: any): string {
    if (location && location.latitude && location.longitude) {
      return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    }
    return 'Location unavailable';
  }

  getTimeAgo(timestamp: any): string {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const alertTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  getAlertColor(status: string): string {
    switch (status) {
      case 'resolved': return 'success';
      case 'responding': return 'warning';
      case 'active': return 'danger';
      default: return 'medium';
    }
  }
}
