import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { EmergencyService } from './emergency.service';
import { AuthService } from './auth.service';
import { BuddyResponseAlertComponent, BuddyResponseData } from '../../shared/components/buddy-response-alert/buddy-response-alert.component';
import { RouteMapComponent, RouteData } from '../../shared/components/route-map/route-map.component';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PatientNotificationService {
  private responseSubscription: Subscription | null = null;
  private currentModal: HTMLIonModalElement | null = null;

  constructor(
    private modalController: ModalController,
    private emergencyService: EmergencyService,
    private authService: AuthService
  ) {}

  /**
   * Start listening for buddy responses for the current user
   */
  async startListeningForBuddyResponses(): Promise<void> {
    try {
      const user = await this.authService.waitForAuthInit();
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      // Check if already listening
      if (this.responseSubscription) {
        console.log('Already listening for buddy responses');
        return;
      }

      console.log('🎧 Starting to listen for buddy responses...');

      // Subscribe to emergency responses
      this.responseSubscription = this.emergencyService.emergencyResponse$.subscribe(
        async (response: any) => {
          if (response) {
            console.log('🚨 Buddy response received:', response);
            await this.showBuddyResponseNotification(response);
          }
        }
      );

    } catch (error) {
      console.error('Error starting buddy response listener:', error);
    }
  }

  /**
   * Stop listening for buddy responses
   */
  stopListeningForBuddyResponses(): void {
    if (this.responseSubscription) {
      this.responseSubscription.unsubscribe();
      this.responseSubscription = null;
      console.log('🔇 Stopped listening for buddy responses');
    }
  }

  /**
   * Automatically show buddy response notification to patient
   */
  private async showBuddyResponseNotification(response: any): Promise<void> {
    try {
      // Close any existing modal first
      if (this.currentModal) {
        await this.currentModal.dismiss();
        this.currentModal = null;
      }

      // Calculate route info
      const routeInfo = await this.calculateRouteInfo(response);

      const buddyData: BuddyResponseData = {
        buddyName: response.responderName || 'Your Buddy',
        estimatedArrival: routeInfo.estimatedTime,
        distance: routeInfo.distance
      };

      // Create and present the modal automatically
      this.currentModal = await this.modalController.create({
        component: BuddyResponseAlertComponent,
        componentProps: {
          buddyData: buddyData
        },
        cssClass: 'buddy-alert-modal',
        backdropDismiss: false,
        keyboardClose: false
      });

      await this.currentModal.present();

      // Handle modal dismissal
      const { data } = await this.currentModal.onDidDismiss();
      this.currentModal = null;
      
      if (data === 'show-route') {
        await this.showPatientRouteView(response, buddyData);
      }

    } catch (error) {
      console.error('Error showing buddy response notification:', error);
    }
  }

  /**
   * Calculate route information for display
   */
  private async calculateRouteInfo(response: any): Promise<{
    distance: string;
    estimatedTime: string;
  }> {
    try {
      // For now, use simplified calculation
      // In a real implementation, you'd use actual routing services
      return {
        distance: '2.5 km', // This would be calculated from actual locations
        estimatedTime: '8 minutes' // This would be calculated from traffic/route data
      };
    } catch (error) {
      console.error('Error calculating route info:', error);
      return {
        distance: 'Calculating...',
        estimatedTime: 'Calculating...'
      };
    }
  }

  /**
   * Show route map to patient
   */
  private async showPatientRouteView(response: any, buddyData: BuddyResponseData): Promise<void> {
    try {
      const routeData: RouteData = {
        origin: { lat: 0, lng: 0 }, // Buddy location (would come from real-time tracking)
        destination: response.location ? 
          { lat: response.location.latitude, lng: response.location.longitude } :
          { lat: 0, lng: 0 },
        buddyName: buddyData.buddyName,
        patientName: 'You'
      };

      const modal = await this.modalController.create({
        component: RouteMapComponent,
        componentProps: {
          routeData: routeData
        },
        cssClass: 'route-map-modal'
      });

      await modal.present();
    } catch (error) {
      console.error('Error showing patient route view:', error);
    }
  }

  /**
   * Force show a test notification (for development/testing)
   */
  async showTestNotification(): Promise<void> {
    console.log('🧪 Showing test buddy response notification');
    
    const testResponse = {
      responderId: 'test-buddy-123',
      responderName: 'Test Buddy',
      emergencyId: 'test-emergency-456',
      location: {
        latitude: 37.7749,
        longitude: -122.4194
      }
    };

    await this.showBuddyResponseNotification(testResponse);
  }

  /**
   * Check if currently listening for responses
   */
  isListening(): boolean {
    return this.responseSubscription !== null;
  }

  /**
   * Cleanup on service destruction
   */
  ngOnDestroy(): void {
    this.stopListeningForBuddyResponses();
    if (this.currentModal) {
      this.currentModal.dismiss();
    }
  }
}