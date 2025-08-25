import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { EmergencyService } from '../../../core/services/emergency.service';
import { Subscription } from 'rxjs';
import { LoadingController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

declare var google: any;

@Component({
  selector: 'app-responder-map',
  templateUrl: './responder-map.page.html',
  styleUrls: ['./responder-map.page.scss'],
  standalone: false,
})
export class ResponderMapPage implements OnInit, OnDestroy {
  @ViewChild('map', { static: true }) mapElement!: ElementRef;
  private map: any;
  private userMarker: any;
  private responderMarker: any;
  private emergencyId: string | null = null;
  private emergencySubscription: Subscription | null = null;
  private updateInterval: any;

  responderName: string = 'Your buddy';
  estimatedArrivalTime: string = '';
  responderDistance: string = '';
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private emergencyService: EmergencyService,
    private loadingController: LoadingController
  ) {
    // Get emergency info from router state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      const state = navigation.extras.state as any;
      if (state.responder) {
        this.responderName = state.responder.responderName || 'Your buddy';
        this.emergencyId = state.responder.emergencyId;
      }
    }
  }

  async ngOnInit() {
    await this.loadMap();
    
    // Set up real-time updates
    if (this.emergencyId) {
      this.subscribeToEmergencyUpdates(this.emergencyId);
      
      // Set up periodic updates for distance and ETA calculations
      this.updateInterval = setInterval(() => {
        this.updateDistanceAndEta();
      }, 10000); // Every 10 seconds
    }
  }
  
  ngOnDestroy() {
    if (this.emergencySubscription) {
      this.emergencySubscription.unsubscribe();
    }
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  async loadMap() {
    const loading = await this.loadingController.create({
      message: 'Loading map...',
    });
    await loading.present();

    try {
      // Default coordinates (will be updated with actual data)
      const position = await this.emergencyService.getCurrentLocation();
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      
      const mapOptions = {
        center: new google.maps.LatLng(latitude, longitude),
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      
      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
      
      // Add marker for user's position
      this.userMarker = new google.maps.Marker({
        map: this.map,
        position: new google.maps.LatLng(latitude, longitude),
        title: 'Your Location',
        icon: {
          url: 'assets/icon/user-marker.png',
          scaledSize: new google.maps.Size(40, 40)
        }
      });
      
      await loading.dismiss();
    } catch (error) {
      console.error('Error loading map:', error);
      await loading.dismiss();
    }
  }
  
  subscribeToEmergencyUpdates(emergencyId: string) {
    this.emergencyService.userEmergency$.subscribe(emergency => {
      if (emergency && emergency.id === emergencyId) {
        // Update user marker
        if (emergency.location && this.map) {
          const userPosition = new google.maps.LatLng(
            emergency.location.latitude, 
            emergency.location.longitude
          );
          
          this.userMarker.setPosition(userPosition);
          
          // Update map center to keep both markers in view
          if (emergency.responderLocation) {
            this.updateMapBounds(userPosition, emergency.responderLocation);
          } else {
            this.map.setCenter(userPosition);
          }
        }
        
        // Update responder marker if available
        if (emergency.responderLocation && this.map) {
          const responderPosition = new google.maps.LatLng(
            emergency.responderLocation.latitude,
            emergency.responderLocation.longitude
          );
          
          if (!this.responderMarker) {
            // Create responder marker if it doesn't exist
            this.responderMarker = new google.maps.Marker({
              map: this.map,
              position: responderPosition,
              title: this.responderName,
              icon: {
                url: 'assets/icon/responder-marker.png',
                scaledSize: new google.maps.Size(40, 40)
              }
            });
          } else {
            // Update existing marker position
            this.responderMarker.setPosition(responderPosition);
          }
          
          // Calculate and update distance/ETA
          this.updateDistanceAndEta();
        }
      }
    });
  }
  
  updateMapBounds(userPosition: any, responderLocation: any) {
    if (!this.map || !responderLocation) return;
    
    const responderPosition = new google.maps.LatLng(
      responderLocation.latitude,
      responderLocation.longitude
    );
    
    // Create bounds that include both markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(userPosition);
    bounds.extend(responderPosition);
    
    // Fit the map to show both markers
    this.map.fitBounds(bounds);
    
    // Add some padding to the bounds
    const padding = { top: 50, right: 50, bottom: 50, left: 50 };
    this.map.fitBounds(bounds, padding);
  }
  
  updateDistanceAndEta() {
    if (!this.map || !this.userMarker || !this.responderMarker) return;
    
    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route(
      {
        origin: this.responderMarker.getPosition(),
        destination: this.userMarker.getPosition(),
        travelMode: google.maps.TravelMode.DRIVING
      },
      (response: any, status: string) => {
        if (status === 'OK') {
          const route = response.routes[0];
          
          // Get distance
          const distance = route.legs[0].distance.text;
          this.responderDistance = distance;
          
          // Get estimated arrival time
          const duration = route.legs[0].duration.text;
          this.estimatedArrivalTime = duration;
        }
      }
    );
  }
  
  goBack() {
    this.router.navigate(['/tabs/home']);
  }
}







