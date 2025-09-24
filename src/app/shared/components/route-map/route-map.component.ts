import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

declare const google: any;

export interface RouteData {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  buddyName: string;
  patientName: string;
}

@Component({
  selector: 'app-route-map',
  templateUrl: './route-map.component.html',
  styleUrls: ['./route-map.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class RouteMapComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  @Input() routeData!: RouteData;

  map: any;
  directionsService: any;
  directionsRenderer: any;
  estimatedTime: string = 'Calculating...';
  distance: string = 'Calculating...';
  private updateInterval: any;

  constructor(private modalController: ModalController) {}

  ngOnInit() {
    this.loadGoogleMaps();
  }

  ngOnDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  private async loadGoogleMaps() {
    try {
      // Check if Google Maps is already loaded
      if (typeof google !== 'undefined' && google.maps) {
        this.initializeMap();
        return;
      }

      // If not loaded, show alternative map or message
      this.showFallbackMap();
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      this.showFallbackMap();
    }
  }

  private initializeMap() {
    if (!this.mapContainer) {
      setTimeout(() => this.initializeMap(), 100);
      return;
    }

    // Initialize map centered between origin and destination
    const center = {
      lat: (this.routeData.origin.lat + this.routeData.destination.lat) / 2,
      lng: (this.routeData.origin.lng + this.routeData.destination.lng) / 2
    };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      zoom: 13,
      center: center,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#2dd36f',
        strokeWeight: 4
      }
    });

    this.directionsRenderer.setMap(this.map);
    this.calculateRoute();

    // Update route every 30 seconds
    this.updateInterval = setInterval(() => {
      this.calculateRoute();
    }, 30000);
  }

  private calculateRoute() {
    const request = {
      origin: this.routeData.origin,
      destination: this.routeData.destination,
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false
    };

    this.directionsService.route(request, (result: any, status: any) => {
      if (status === 'OK') {
        this.directionsRenderer.setDirections(result);
        const route = result.routes[0];
        const leg = route.legs[0];
        
        this.estimatedTime = leg.duration.text;
        this.distance = leg.distance.text;
      } else {
        console.error('Directions request failed due to ' + status);
        this.showFallbackInfo();
      }
    });
  }

  private showFallbackMap() {
    // Show a simple static map or text-based directions
    const mapUrl = `https://www.google.com/maps/dir/${this.routeData.origin.lat},${this.routeData.origin.lng}/${this.routeData.destination.lat},${this.routeData.destination.lng}`;
    
    this.estimatedTime = 'Open in Maps app';
    this.distance = 'See route details';
    
    // You could also implement a fallback using OpenStreetMap or similar
  }

  private showFallbackInfo() {
    // Calculate rough distance as fallback
    const distance = this.calculateDistance(
      this.routeData.origin.lat,
      this.routeData.origin.lng,
      this.routeData.destination.lat,
      this.routeData.destination.lng
    );
    
    this.distance = `~${distance.toFixed(1)} km`;
    this.estimatedTime = `~${Math.ceil(distance * 2)} minutes`; // Rough estimate
  }

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

  openInMapsApp() {
    const url = `https://www.google.com/maps/dir/${this.routeData.origin.lat},${this.routeData.origin.lng}/${this.routeData.destination.lat},${this.routeData.destination.lng}`;
    window.open(url, '_system');
  }

  async dismiss() {
    await this.modalController.dismiss();
  }
}