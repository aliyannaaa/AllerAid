import { Component } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AllergyService } from './core/services/allergy.service';
import { AuthService } from './core/services/auth.service';
import { EmergencyDetectorService } from './core/services/emergency-detector.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private menuController: MenuController, 
    private allergyService: AllergyService,
    private authService: AuthService,
    private router: Router,
    private emergencyDetectorService: EmergencyDetectorService
  ) {
    this.allergyService.resetAllergyOptions();
    // Initialize emergency detection on app startup
    this.initializeEmergencyDetection();
  }
  
  private async initializeEmergencyDetection() {
    // The service will auto-initialize when injected
    console.log('Emergency detector service initialized in app component');
  }

  onMenuItemClick() {
    this.menuController.close();
  }

  async logout() {
    try {
      console.log('Attempting to log out...');
      await this.authService.signOut();
      await this.menuController.close();
      console.log('Navigating to login page...');
      await this.router.navigate(['/login'], { replaceUrl: true });
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Still close menu and navigate even if there's an error
      await this.menuController.close();
      await this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
