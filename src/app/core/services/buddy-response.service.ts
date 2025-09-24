import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { BuddyResponseAlertComponent, BuddyResponseData } from '../../shared/components/buddy-response-alert/buddy-response-alert.component';
import { RouteMapComponent, RouteData } from '../../shared/components/route-map/route-map.component';
import { EmergencyService } from './emergency.service';
import { BuddyService } from './buddy.service';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class BuddyResponseService {

  constructor(
    private modalController: ModalController,
    private emergencyService: EmergencyService,
    private buddyService: BuddyService
  ) {}

  /**
   * Handle buddy clicking "I'm on my way" button
   */
  async handleBuddyResponse(emergency: any, buddyName: string, buddyId: string): Promise<void> {
    try {
      console.log('🚨 Buddy responding to emergency:', emergency.id);
      
      // Update emergency status through the emergency service
      // This will trigger the real-time listener that patients are subscribed to
      await this.emergencyService.respondToEmergency(
        emergency.id,
        buddyId,
        buddyName
      );

      console.log('✅ Emergency response recorded, patient will be notified automatically');

      // Get current buddy location
      const buddyLocation = await this.getCurrentLocation();
      
      // Show route map to buddy
      await this.showRouteMapToBuddy(emergency, buddyName, buddyLocation);

      console.log('✅ Buddy response handling complete');

    } catch (error) {
      console.error('Error handling buddy response:', error);
      throw error;
    }
  }

  /**
   * Get current location using browser geolocation API
   */
  private async getCurrentLocation(): Promise<LocationCoords> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fallback to approximate location or ask user
          reject(new Error('Unable to get current location'));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Calculate route information between two points
   */
  private async calculateRouteInfo(origin: LocationCoords, destination: any): Promise<{
    distance: string;
    estimatedTime: string;
  }> {
    try {
      // Calculate straight-line distance as fallback
      const distance = this.calculateDistance(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude
      );

      // Rough time estimate (assuming average city driving speed)
      const estimatedMinutes = Math.ceil(distance * 2); // ~30 km/h average

      return {
        distance: `${distance.toFixed(1)} km`,
        estimatedTime: `${estimatedMinutes} minutes`
      };
    } catch (error) {
      console.error('Error calculating route:', error);
      return {
        distance: 'Calculating...',
        estimatedTime: 'Calculating...'
      };
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Show route map to buddy
   */
  private async showRouteMapToBuddy(emergency: any, buddyName: string, buddyLocation: LocationCoords): Promise<void> {
    const routeData: RouteData = {
      origin: { lat: buddyLocation.latitude, lng: buddyLocation.longitude },
      destination: { lat: emergency.location.latitude, lng: emergency.location.longitude },
      buddyName: buddyName,
      patientName: emergency.userName || emergency.patientName
    };

    const modal = await this.modalController.create({
      component: RouteMapComponent,
      componentProps: {
        routeData: routeData
      },
      cssClass: 'route-map-modal'
    });

    await modal.present();
  }
}