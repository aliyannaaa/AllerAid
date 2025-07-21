import { Component, OnInit } from '@angular/core';
import { UserService, UserProfile } from '../service/user.service';
import { AllergyService } from '../service/allergy.service';
import { BuddyService } from '../service/buddy.service';
import { AuthService } from '../service/auth.service';
import { BarcodeService } from '../service/barcode.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit {

  selectedTab: 'overview' | 'health' | 'emergency' = 'overview';
  showEditAllergiesModal = false;
  showEditEmergencyModal = false;
  showEditMedicationsModal = false;
  showEditEmergencyMessageModal = false;

  userProfile: UserProfile | null = null;
  userAllergies: any[] = [];
  userBuddies: any[] = [];
  emergencyInstruction: string = '';

  allergiesCount = 0;
  medicationsCount = 0;
  buddiesCount = 0;

  allergyOptions = [
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
  ];

  constructor(
    private userService: UserService,
    private allergyService: AllergyService,
    private buddyService: BuddyService,
    private authService: AuthService,
    private barcodeService: BarcodeService,
    private toastController: ToastController
  ) { }

  async ngOnInit() {
    await this.loadAllergyOptions();
    await this.loadUserData();
  }

  async loadAllergyOptions() {
    try {
      // Load allergy options from Firebase
      const options = await this.allergyService.getAllergyOptions();
      
      if (options && options.length > 0) {
        // Use options from Firebase, sorted by order
        this.allergyOptions = options.sort((a, b) => a.order - b.order).map(option => ({
          name: option.name,
          label: option.label,
          checked: false,
          hasInput: option.hasInput || false,
          value: ''
        }));
      }
      // If no options in Firebase, keep the hardcoded ones as fallback
      console.log('Loaded allergy options:', this.allergyOptions); // Debug log
    } catch (error) {
      console.error('Error loading allergy options:', error);
      // Keep hardcoded options as fallback
    }
  }

  async loadUserData() {
    try {
      // Get current user using AuthService
      const currentUser = await this.authService.waitForAuthInit();
      
      if (!currentUser) {
        console.log('No authenticated user found');
        this.presentToast('Please log in to view your profile');
        return;
      }
      
      console.log('Loading profile data for user:', currentUser.uid); // Debug log
      
      // Load user profile
      this.userProfile = await this.userService.getUserProfile(currentUser.uid);
      
      if (this.userProfile) {
        // Load user allergies
        const userAllergyDocs = await this.allergyService.getUserAllergies(currentUser.uid);
        console.log('User allergy docs:', userAllergyDocs); // Debug log
        
        this.userAllergies = [];
        
        // Flatten the allergies from documents and filter only checked ones
        userAllergyDocs.forEach((allergyDoc: any) => {
          if (allergyDoc.allergies && Array.isArray(allergyDoc.allergies)) {
            // Only include allergies that are checked
            const checkedAllergies = allergyDoc.allergies.filter((allergy: any) => allergy.checked);
            this.userAllergies.push(...checkedAllergies);
          }
        });
        
        console.log('Processed user allergies:', this.userAllergies); // Debug log
        this.allergiesCount = this.userAllergies.length;
        
        // Load user buddies
        this.userBuddies = await this.buddyService.getUserBuddies(currentUser.uid);
        this.buddiesCount = this.userBuddies.length;
        
        // Set medications count (placeholder for now)
        this.medicationsCount = 2; // You can implement medication service later
        
        // Update allergy options based on user's allergies
        this.updateAllergyOptions();
        
        // Set emergency instruction from user profile
        this.emergencyInstruction = this.userProfile.emergencyInstruction || '';
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      this.presentToast('Error loading profile data');
    }
  }

  updateAllergyOptions() {
    console.log('Updating allergy options with user allergies:', this.userAllergies); // Debug log
    
    // Reset all options first
    this.allergyOptions.forEach(option => {
      option.checked = false;
      if (option.hasInput) {
        option.value = '';
      }
    });
    
    // Update options based on user's saved allergies
    this.allergyOptions.forEach(option => {
      const userAllergy = this.userAllergies.find(allergy => 
        allergy.name === option.name && allergy.checked === true
      );
      
      if (userAllergy) {
        console.log(`Setting ${option.name} to checked with value:`, userAllergy.value); // Debug log
        option.checked = true;
        if (option.hasInput && userAllergy.value) {
          option.value = userAllergy.value;
        }
      }
    });
    
    console.log('Updated allergy options:', this.allergyOptions); // Debug log
  }

  selectTab(tab: 'overview' | 'health' | 'emergency') {
    this.selectedTab = tab;
  }

  async saveAllergies() {
    try {
      // Get current user
      const currentUser = await this.authService.waitForAuthInit();
      
      if (!currentUser) {
        this.presentToast('Please log in to save allergies');
        return;
      }

      console.log('Saving allergies for user:', currentUser.uid); // Debug log
      console.log('Current allergy options:', this.allergyOptions); // Debug log
      
      // Prepare allergies for saving (same format as onboarding page)
      const sanitizedAllergies = this.allergyOptions.map(allergy => {
        const cleanAllergy: Record<string, any> = {
          id: allergy.name, // Use name as id for consistency
          name: allergy.name,
          label: allergy.label,
          checked: allergy.checked,
          hasInput: allergy.hasInput || false
        };
        
        // Only include input value if it's not empty
        if (allergy.hasInput && allergy.value) {
          cleanAllergy['value'] = allergy.value;
        }
        
        return cleanAllergy;
      });
      
      console.log('Sanitized allergies:', sanitizedAllergies); // Debug log
      
      // Check if user already has allergy data
      const userAllergies = await this.allergyService.getUserAllergies(currentUser.uid);
      
      if (userAllergies && userAllergies.length > 0) {
        // User has existing allergy data - update it
        const allergyDocId = userAllergies[0].id;
        await this.allergyService.updateUserAllergies(allergyDocId, sanitizedAllergies);
        console.log('Updated user allergies');
      } else {
        // No existing data - create new record
        await this.allergyService.addUserAllergies(currentUser.uid, sanitizedAllergies);
        console.log('Created new user allergies record');
      }
      
      // Reload user data to refresh the display
      await this.loadUserData();
      
      this.showEditAllergiesModal = false;
      this.presentToast('Allergies updated successfully');
    } catch (error) {
      console.error('Error saving allergies:', error);
      this.presentToast('Error saving allergies');
    }
  }

  async saveEmergencyInstruction() {
    if (!this.userProfile) {
      this.presentToast('User profile not loaded');
      return;
    }

    try {
      // For now, we'll store it in the user profile
      // Later you can create a separate EmergencyService
      await this.userService.updateUserProfile(this.userProfile.uid, {
        emergencyInstruction: this.emergencyInstruction
      });
      
      this.showEditEmergencyModal = false;
      this.presentToast('Emergency instruction saved successfully');
    } catch (error) {
      console.error('Error saving emergency instruction:', error);
      this.presentToast('Error saving emergency instruction');
    }
  }

  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'medium'
    });
    await toast.present();
  }

  getUserDisplayName(): string {
    return this.userProfile?.fullName || 'User';
  }

  getUserAllergiesDisplay(): string {
    return this.userAllergies.map(allergy => allergy.label).join(', ') || 'None';
  }

  async scanProduct() {
    if (this.userAllergies.length === 0) {
      await this.presentToast('Please add allergies to your profile first');
      return;
    }

    const barcode = await this.barcodeService.scanBarcode();
    if (barcode) {
      const userAllergenNames = this.userAllergies.map(a => a.name || a.label);
      await this.barcodeService.checkProductForAllergens(barcode, userAllergenNames);
    }
  }
}
