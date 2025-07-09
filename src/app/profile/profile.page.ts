import { Component, OnInit } from '@angular/core';
import { UserService, UserProfile } from '../service/user.service';
import { AllergyService } from '../service/allergy.service';
import { BuddyService } from '../service/buddy.service';
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

  // User data
  userProfile: UserProfile | null = null;
  userAllergies: any[] = [];
  userBuddies: any[] = [];
  emergencyInstruction: string = '';

  // Stats
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
    private toastController: ToastController
  ) { }

  async ngOnInit() {
    await this.loadUserData();
  }

  async loadUserData() {
    try {
      // Load user profile
      this.userProfile = await this.userService.getCurrentUserProfile();
      
      if (this.userProfile) {
        // Load user allergies
        const userAllergyDocs = await this.allergyService.getUserAllergies(this.userProfile.uid);
        this.userAllergies = [];
        
        // Flatten the allergies from documents
        userAllergyDocs.forEach((allergyDoc: any) => {
          if (allergyDoc.allergies) {
            this.userAllergies.push(...allergyDoc.allergies);
          }
        });
        
        this.allergiesCount = this.userAllergies.length;
        
        // Load user buddies
        this.userBuddies = await this.buddyService.getUserBuddies(this.userProfile.uid);
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
    this.allergyOptions.forEach(option => {
      const userAllergy = this.userAllergies.find(allergy => allergy.name === option.name);
      if (userAllergy) {
        option.checked = true;
        if (option.hasInput) {
          option.value = userAllergy.value || '';
        }
      }
    });
  }

  selectTab(tab: 'overview' | 'health' | 'emergency') {
    this.selectedTab = tab;
  }

  async saveAllergies() {
    if (!this.userProfile) {
      this.presentToast('User profile not loaded');
      return;
    }

    try {
      // Clear existing allergies
      await this.allergyService.clearUserAllergies(this.userProfile.uid);
      
      // Add selected allergies
      const selectedAllergies = this.allergyOptions.filter(option => option.checked);
      
      for (const allergy of selectedAllergies) {
        await this.allergyService.addUserAllergy(this.userProfile.uid, {
          name: allergy.name,
          label: allergy.label,
          value: allergy.value || null
        });
      }
      
      // Reload user data
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
}
