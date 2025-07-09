import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AllergyService } from '../../service/allergy.service';
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
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadAllergyOptions();
  }

  async loadAllergyOptions() {
    try {
      this.isLoading = true;
      
      // Load allergy options from Firebase
      let options = await this.allergyService.getAllergyOptions();
      
      // If no options exist in Firebase, use fallback
      if (options.length === 0) {
        // Use hardcoded fallback since createAllergyOptions() is disabled
        this.useFallbackOptions();
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
      this.useFallbackOptions();
    } finally {
      this.isLoading = false;
    }
  }

  useFallbackOptions() {
    // Fallback to hardcoded options if Firebase fails
    this.allergyOptions = [
      { name: 'peanuts', label: 'Peanuts/Nuts', checked: false },
      { name: 'dairy', label: 'Dairy/Milk', checked: false },
      { name: 'eggs', label: 'Eggs', checked: false },
      { name: 'wheat', label: 'Wheat/Gluten', checked: false },
      { name: 'fish', label: 'Fish', checked: false },
      { name: 'shellfish', label: 'Shellfish', checked: false },
      { name: 'soy', label: 'Soy', checked: false },
      { name: 'pollen', label: 'Pollen', checked: false },
      { name: 'latex', label: 'Latex', checked: false },
      { name: 'animalDander', label: 'Animal Dander', checked: false },
      { name: 'insectStings', label: 'Insect Stings', checked: false },
      { name: 'medication', label: 'Medication', checked: false, hasInput: true, value: '' },
      { name: 'others', label: 'Others', checked: false, hasInput: true, value: '' },
      { name: 'none', label: 'No Allergies', checked: false }
    ];
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
      // For now, using a placeholder user ID. In a real app, you'd get this from authentication
      const userId = 'user123'; // Replace with actual user ID from auth
      
      // Save to Firebase
      await this.allergyService.addUserAllergies(userId, selectedAllergies);
      
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

  // Method to delete all allergy options from Firebase
  async deleteAllAllergyOptions() {
    try {
      await this.allergyService.deleteAllAllergyOptions();
      
      const toast = await this.toastController.create({
        message: 'All allergy options deleted from Firebase!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      
      // Reload options (will use fallback since Firebase is now empty)
      this.loadAllergyOptions();
      
    } catch (error) {
      console.error('Error deleting allergy options:', error);
      const toast = await this.toastController.create({
        message: 'Failed to delete allergy options.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

}
