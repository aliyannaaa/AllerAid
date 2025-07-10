import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AllergyService } from '../../service/allergy.service';
import { UserService } from '../../service/user.service';
import { AuthService } from '../../service/auth.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-allergy-onboarding',
  templateUrl: './allergy-onboarding.page.html',
  styleUrls: ['./allergy-onboarding.page.scss'],
  standalone: false,
})
export class AllergyOnboardingPage implements OnInit {
  allergyOptions: any[] = [];
  isLoading = true;

  constructor(
    private router: Router,
    private allergyService: AllergyService,
    private userService: UserService,
    private authService: AuthService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    // Check if user is logged in
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadAllergyOptions();
  }

  async loadAllergyOptions() {
    try {
      this.isLoading = true;
      
      // Load allergy options from Firebase
      let options = await this.allergyService.getAllergyOptions();
      
      console.log('Loaded options from Firebase:', options);
      
      // If no options exist in Firebase, show empty state
      if (!options || options.length === 0) {
        console.log('No options in Firebase, showing empty state');
        this.allergyOptions = [];
        return;
      }
      
      // Add checked and value properties for UI
      this.allergyOptions = options.map(option => ({
        ...option,
        checked: false,
        value: option.hasInput ? '' : undefined
      }));
      
    } catch (error) {
      console.error('Error loading allergy options:', error);
      this.allergyOptions = [];
    } finally {
      this.isLoading = false;
    }
  }



  async submitAllergies() {
    // Filter selected allergies
    const selectedAllergies = this.allergyOptions.filter(allergy => allergy.checked);
    
    if (selectedAllergies.length === 0) {
      const toast = await this.toastController.create({
        message: 'Please select at least one allergy or tap "No Allergies"',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    try {
      // Get current user ID from authentication
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        const toast = await this.toastController.create({
          message: 'You must be logged in to save allergies',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
        this.router.navigate(['/login']);
        return;
      }
      
      // Save to Firebase
      await this.allergyService.addUserAllergies(currentUser.uid, selectedAllergies);
      
      // Mark allergy onboarding as completed
      await this.userService.markAllergyOnboardingCompleted(currentUser.uid);
      
      // Show success message
      const toast = await this.toastController.create({
        message: 'Allergies saved successfully!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      // Navigate to main app
      this.router.navigate(['/tabs/home']);
      
    } catch (error) {
      console.error('Error saving allergies:', error);
      const toast = await this.toastController.create({
        message: 'Failed to save allergies. Please try again.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  // Check if we're currently using fallback options
  get isUsingFallbackOptions(): boolean {
    return this.allergyOptions.length > 0 && 
           this.allergyOptions.some(option => option.name === 'none' && option.label === 'No Allergies');
  }




}
