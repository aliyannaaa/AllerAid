import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BuddyService } from '../../../../core/services/buddy.service';
import { AuthService } from '../../../../core/services/auth.service';
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
  patients: any[] = [];
  activeEmergencies: any[] = [];
  recentAlerts: any[] = [];
  private emergencySubscription: Subscription | null = null;
  private buddyRelationSubscription?: Subscription;
  private previousEmergencyCount: number = 0;
  invitationCount: number = 0;

  constructor(
    private router: Router,
    private buddyService: BuddyService,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    await this.loadDashboardData();
    await this.setupRealTimeListeners();
  }

  ngOnDestroy() {
    if (this.emergencySubscription) {
      this.emergencySubscription.unsubscribe();
    }
    if (this.buddyRelationSubscription) {
      this.buddyRelationSubscription.unsubscribe();
    }
  }

  private async loadDashboardData() {
    try {
      const user = await this.authService.waitForAuthInit();
      if (user) {
        await Promise.all([
          this.loadPatients(),
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
        this.emergencySubscription = this.buddyService.activeEmergencyAlerts$.subscribe((emergencies: any[]) => {
          // Check if we have new emergencies to play notification sound
          const newEmergencyCount = emergencies.filter((e: any) => e.status === 'active').length;
          if (newEmergencyCount > this.previousEmergencyCount && this.previousEmergencyCount >= 0) {
            this.playEmergencyNotificationSound();
          }
          this.previousEmergencyCount = newEmergencyCount;
          
          this.activeEmergencies = emergencies;
          console.log('Active emergencies updated:', this.activeEmergencies);
        });

        // Listen for buddy relation updates to refresh patient list
        this.buddyRelationSubscription = this.buddyService.buddyRelations$.subscribe(() => {
          this.loadPatients();
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
      // First try by userId
      let invitations = await this.buddyService.getReceivedInvitations(buddyUserId);
      
      // If no invitations found by userId, try by email
      if (invitations.length === 0) {
        const user = await this.authService.waitForAuthInit();
        if (user?.email) {
          console.log('No invitations found by userId, trying email in dashboard...');
          invitations = await this.buddyService.getReceivedInvitationsByEmail(user.email);
        }
      }
      
      this.invitationCount = invitations.filter((inv: any) => inv.status === 'pending').length;
    } catch (error) {
      console.error('Error loading invitation count:', error);
      this.invitationCount = 0;
    }
  }

  private async loadPatients() {
    try {
      const user = await this.authService.waitForAuthInit();
      if (user) {
        // Load patients this buddy is monitoring using the updated method
        this.patients = await this.buddyService.getProtectedPatients(user.uid);
        console.log('Loaded patients in dashboard:', this.patients);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      this.patients = [];
    }
  }

  private async loadRecentAlerts(buddyUserId: string) {
    // Load recent emergency alerts
    this.recentAlerts = [];
  }

  async refreshDashboard() {
    await this.loadDashboardData();
  }

  // Temporary debug method to fix accepted invitations
  async fixAcceptedInvitations() {
    try {
      console.log('Fixing accepted invitations...');
      await this.buddyService.fixAcceptedInvitations();
      console.log('Fix completed, refreshing dashboard...');
      await this.refreshDashboard();
    } catch (error) {
      console.error('Error fixing invitations:', error);
    }
  }

  // Debug method to check buddy relations
  async debugBuddyRelations() {
    try {
      const user = await this.authService.waitForAuthInit();
      if (user) {
        console.log('=== DEBUGGING BUDDY RELATIONS FOR BUDDY DASHBOARD ===');
        console.log('Current user ID:', user.uid);
        console.log('Current user email:', user.email);
        console.log('Current user name:', user.displayName);
        
        // Check what this specific query returns
        console.log('Checking getProtectedPatients for current user...');
        const relations = await this.buddyService.getProtectedPatients(user.uid);
        console.log('Protected patients found:', relations);
        
        // Also check all buddy relations in the database
        console.log('Running comprehensive buddy relation check...');
        await this.buddyService.debugBuddyRelations();
        
        // Force refresh the patient list
        console.log('Force refreshing patient list...');
        this.patients = relations;
      }
    } catch (error) {
      console.error('Debug error:', error);
    }
  }

  async respondToEmergency(emergency: any) {
    try {
      const user = await this.authService.waitForAuthInit();
      if (user) {
        // Navigate to emergency response
        this.router.navigate(['/tabs/emergency/respond'], { 
          state: { 
            emergency: emergency,
            responderName: user.displayName || 'Buddy Response'
          }
        });
      }
    } catch (error) {
      console.error('Error responding to emergency:', error);
    }
  }

  goToPatientProfile(patient: any) {
    this.router.navigate(['/tabs/buddy/patient-profile', patient.id]);
  }

  goToInvitations() {
    this.router.navigate(['/tabs/buddy/invitations']);
  }
}
