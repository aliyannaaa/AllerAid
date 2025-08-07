import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService, UserProfile } from '../service/user.service';
import { AllergyService } from '../service/allergy.service';
import { BuddyService } from '../service/buddy.service';
import { AuthService } from '../service/auth.service';
import { BarcodeService } from '../service/barcode.service';
import { MedicalService, EmergencyMessage } from '../service/medical.service';
import { EmergencyAlertService } from '../service/emergency-alert.service';
import { MedicationService, Medication } from '../service/medication.service';
import { EHRService, DoctorVisit, MedicalHistory, EmergencyContact, HealthcareProvider, AccessRequest } from '../service/ehr.service';
import { ToastController, ModalController, AlertController } from '@ionic/angular';
import { AddMedicationModal } from '../modals/add-medication.modal';
import { AddDoctorVisitModal } from '../modals/add-doctor-visit.modal';
import { AddMedicalHistoryModal } from '../modals/add-medical-history.modal';
import { AddEmergencyContactModal } from '../modals/add-emergency-contact.modal';
import { ImageViewerModal } from '../modals/image-viewer.modal';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit, OnDestroy {

  selectedTab: 'overview' | 'health' | 'emergency' | 'ehr' = 'overview';
  showEditAllergiesModal = false;
  showEditEmergencyMessageModal = false;
  showExamplesModal = false;
  showManageInstructionsModal = false;

  // Emergency instructions (per-allergy specific)
  emergencyInstructions: any[] = [];
  selectedAllergyForInstruction: any = null;
  newInstructionText: string = '';

  // Emergency settings
  emergencySettings = {
    shakeToAlert: true,
    powerButtonAlert: true,
    audioInstructions: true
  };

  userProfile: UserProfile | null = null;
  userAllergies: any[] = [];
  userBuddies: any[] = [];
  userMedications: Medication[] = [];
  filteredMedications: Medication[] = [];
  medicationFilter: string = 'all';
  medicationSearchTerm: string = '';
  emergencyMessage: EmergencyMessage = {
    name: '',
    allergies: '',
    instructions: '',
    location: ''
  };

  // EHR related properties
  doctorVisits: DoctorVisit[] = [];
  medicalHistory: MedicalHistory[] = [];
  emergencyContacts: EmergencyContact[] = [];
  ehrAccessList: string[] = [];
  healthcareProviders: HealthcareProvider[] = [];
  pendingRequests: AccessRequest[] = [];
  newProviderEmail: string = '';
  newProviderName: string = '';
  newProviderRole: 'doctor' | 'nurse' = 'doctor';
  newProviderLicense: string = '';
  newProviderSpecialty: string = '';
  newProviderHospital: string = '';

  allergiesCount = 0;
  medicationsCount = 0;
  buddiesCount = 0;

  allergyOptions: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private allergyService: AllergyService,
    private buddyService: BuddyService,
    private authService: AuthService,
    private barcodeService: BarcodeService,
    private medicalService: MedicalService,
    private emergencyAlertService: EmergencyAlertService,
    private medicationService: MedicationService,
    private ehrService: EHRService,
    private toastController: ToastController,
    private modalController: ModalController,
    private alertController: AlertController
  ) { }

  async ngOnInit() {
    // Check for query parameters to set the selected tab
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.selectedTab = params['tab'];
      }
    });
    
    await this.loadAllergyOptions();
    await this.loadUserData();
    await this.loadMedicalData();
    await this.loadEmergencyInstructions();
    await this.loadUserMedications();
    await this.loadEHRData();
    
    // Load access requests if user is a doctor or nurse
    if (this.userProfile?.role === 'doctor' || this.userProfile?.role === 'nurse') {
      await this.loadAccessRequests();
    }
  }

  async loadAllergyOptions() {
    try {
      // Load allergy options from Firebase
      const options = await this.allergyService.getAllergyOptions();
      
      if (options && options.length > 0) {
        // Remove duplicates by name and sort by order
        const uniqueOptions = options.reduce((acc: any[], option: any) => {
          const exists = acc.find(item => item.name === option.name);
          if (!exists) {
            acc.push(option);
          }
          return acc;
        }, []);

        this.allergyOptions = uniqueOptions
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(option => ({
            name: option.name,
            label: option.label,
            checked: false,
            hasInput: option.hasInput || false,
            value: ''
          }));
      } else {
        // Fallback options if Firebase is empty
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
          { name: 'others', label: 'Others', checked: false, hasInput: true, value: '' }
        ];
      }
      
      console.log('Loaded allergy options:', this.allergyOptions);
    } catch (error) {
      console.error('Error loading allergy options:', error);
      
      this.allergyOptions = [
        { name: 'peanuts', label: 'Peanuts/Nuts', checked: false },
        { name: 'dairy', label: 'Dairy/Milk', checked: false },
        { name: 'eggs', label: 'Eggs', checked: false },
        { name: 'wheat', label: 'Wheat/Gluten', checked: false },
        { name: 'fish', label: 'Fish', checked: false },
        { name: 'shellfish', label: 'Shellfish', checked: false },
        { name: 'soy', label: 'Soy', checked: false }
      ];
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
        
        // Load emergency message if exists
        if (this.userProfile.emergencyMessage) {
          this.emergencyMessage = this.userProfile.emergencyMessage;
        } else {
          // Set default emergency message values
          this.emergencyMessage = {
            name: this.userProfile.fullName || '',
            allergies: this.getUserAllergiesDisplay(),
            instructions: 'Use EpiPen immediately',
            location: 'Google Maps'
          };
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      this.presentToast('Error loading profile data');
    }
  }

  async loadEmergencyInstructions() {
    if (!this.userProfile) return;
    
    try {
      this.emergencyInstructions = await this.medicalService.getEmergencyInstructions(this.userProfile.uid);
    } catch (error) {
      console.error('Error loading emergency instructions:', error);
    }
  }

  async loadUserMedications() {
    if (!this.userProfile) return;
    
    try {
      this.userMedications = await this.medicationService.getUserMedications(this.userProfile.uid);
      this.medicationsCount = this.userMedications.length;
      this.clearMedicationCache(); // Clear cache when medications reload
      this.filterMedications(); // Apply current filter
    } catch (error) {
      console.error('Error loading medications:', error);
    }
  }

  /**
   * Filter medications based on selected filter
   * Using memoization to improve performance
   */
  private medicationFilterCache = new Map<string, Medication[]>();
  
  filterMedications() {
    const cacheKey = `${this.medicationFilter}-${this.medicationSearchTerm}`;
    
    // Check cache first
    if (this.medicationFilterCache.has(cacheKey)) {
      this.filteredMedications = this.medicationFilterCache.get(cacheKey)!;
      return;
    }

    let filtered = [...this.userMedications];

    // Apply search filter first if there's a search term
    if (this.medicationSearchTerm && this.medicationSearchTerm.trim()) {
      const term = this.medicationSearchTerm.toLowerCase();
      filtered = filtered.filter(med => 
        med.name.toLowerCase().includes(term) ||
        med.notes?.toLowerCase().includes(term) ||
        med.dosage.toLowerCase().includes(term) ||
        med.prescribedBy?.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    switch (this.medicationFilter) {
      case 'emergency':
        filtered = filtered.filter(med => 
          med.category === 'emergency' || 
          med.category === 'allergy' ||
          med.emergencyMedication === true
        );
        break;
      case 'daily':
        filtered = filtered.filter(med => 
          med.category === 'daily'
        );
        break;
      case 'active':
        filtered = filtered.filter(med => 
          med.isActive
        );
        break;
      case 'expiring':
        filtered = filtered.filter(med => 
          this.isExpiringSoon(med.expiryDate)
        );
        break;
      default:
        // 'all' case - no additional filtering needed
        break;
    }

    // Cache the result
    this.medicationFilterCache.set(cacheKey, filtered);
    this.filteredMedications = filtered;
  }

  /**
   * Clear medication filter cache when medications change
   */
  private clearMedicationCache() {
    this.medicationFilterCache.clear();
  }

  /**
   * Search medications with debouncing
   */
  private searchTimeout: any;
  
  searchMedications(event: any) {
    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Set new timeout for debounced search
    this.searchTimeout = setTimeout(() => {
      this.medicationSearchTerm = event.target.value;
      this.clearMedicationCache(); // Clear cache when search changes
      this.filterMedications();
    }, 300); // 300ms delay
  }

  /**
   * Get active medications count
   */
  getActiveMedicationsCount(): number {
    return this.userMedications.filter(med => med.isActive).length;
  }

  /**
   * Get emergency medications count
   */
  getEmergencyMedicationsCount(): number {
    return this.userMedications.filter(med => 
      med.emergencyMedication === true || 
      med.category === 'emergency' || 
      med.category === 'allergy'
    ).length;
  }

  /**
   * Get expiring medications count
   */
  getExpiringMedicationsCount(): number {
    return this.userMedications.filter(med => 
      this.isExpiringSoon(med.expiryDate)
    ).length;
  }

  /**
   * Check if medication is expiring soon
   */
  isExpiringSoon(expiryDate?: string): boolean {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow;
  }

  /**
   * Get medication type label
   */
  getMedicationTypeLabel(type: string): string {
    const types = {
      'tablet': 'Tablet',
      'capsule': 'Capsule',
      'liquid': 'Liquid/Syrup',
      'injection': 'Injection',
      'inhaler': 'Inhaler',
      'cream': 'Cream/Ointment',
      'drops': 'Drops',
      'patch': 'Patch',
      'other': 'Other'
    };
    return types[type as keyof typeof types] || type;
  }

  /**
   * Get route label
   */
  getRouteLabel(route: string): string {
    const routes = {
      'oral': 'Oral (by mouth)',
      'topical': 'Topical (on skin)',
      'injection': 'Injection',
      'inhalation': 'Inhalation',
      'nasal': 'Nasal',
      'ophthalmic': 'Eye drops',
      'otic': 'Ear drops'
    };
    return routes[route as keyof typeof routes] || route;
  }

  /**
   * View medication details
   */
  async viewMedicationDetails(medication: Medication) {
    // This would open a detailed view modal
    console.log('Viewing details for:', medication.name);
    this.presentToast(`Viewing details for ${medication.name}`);
  }

  /**
   * View medication image in full screen
   */
  async viewMedicationImage(imageUrl: string, title: string) {
    const modal = await this.modalController.create({
      component: ImageViewerModal,
      componentProps: {
        imageUrl: imageUrl,
        title: title,
        fileName: `${title.toLowerCase().replace(/\s+/g, '-')}.jpg`
      }
    });

    await modal.present();
  }

  /**
   * View medication report
   */
  async viewMedicationReport() {
    const report = {
      total: this.medicationsCount,
      active: this.getActiveMedicationsCount(),
      emergency: this.getEmergencyMedicationsCount(),
      expiring: this.getExpiringMedicationsCount(),
      categories: this.getMedicationCategoriesReport()
    };
    
    console.log('Medication Report:', report);
    this.presentToast('Medication report generated');
  }

  /**
   * Export medication list
   */
  async exportMedicationList() {
    const medicationData = this.userMedications.map(med => ({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      category: med.category,
      prescribedBy: med.prescribedBy,
      startDate: med.startDate,
      expiryDate: med.expiryDate,
      isActive: med.isActive
    }));
    
    console.log('Exporting medications:', medicationData);
    this.presentToast('Medication list exported');
  }

  /**
   * Get medication categories report
   */
  private getMedicationCategoriesReport() {
    const categories = this.userMedications.reduce((acc, med) => {
      acc[med.category] = (acc[med.category] || 0) + 1;
      return acc;
    }, {} as any);
    return categories;
  }

  async loadMedicalData() {
    try {
      // Get current user using AuthService
      const currentUser = await this.authService.waitForAuthInit();
      
      if (!currentUser) {
        console.log('No authenticated user found for medical data');
        return;
      }

      // Load medical profile data from medical service
      const medicalProfile = await this.medicalService.getUserMedicalProfile(currentUser.uid);
      
      if (medicalProfile) {
        // Update emergency message if it exists in medical profile
        if (medicalProfile.emergencyMessage) {
          this.emergencyMessage = medicalProfile.emergencyMessage;
        }
        
        // Update emergency settings if they exist in medical profile
        if (medicalProfile.emergencySettings) {
          this.emergencySettings = {
            ...this.emergencySettings,
            ...medicalProfile.emergencySettings
          };
        }
        
        console.log('Loaded medical data:', medicalProfile);
      }
    } catch (error) {
      console.error('Error loading medical data:', error);
      // Don't show toast for medical data errors, it's not critical
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

  selectTab(tab: 'overview' | 'health' | 'emergency' | 'ehr') {
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

  /**
   * Get character count for emergency instruction display
   */
  getCharacterCount(): number {
    const displayText = this.getEmergencyInstructionDisplay();
    return displayText ? displayText.length : 0;
  }

  /**
   * Test text-to-speech for emergency instruction
   */
  async testInstructionAudio() {
    const instructionsText = this.getEmergencyInstructionDisplay();
    if (!instructionsText) {
      this.presentToast('Please add emergency instructions first');
      return;
    }

    try {
      // Use browser's speech synthesis API
      if ('speechSynthesis' in window) {
        // Stop any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(instructionsText);
        utterance.rate = 0.8; // Slightly slower for clarity
        utterance.volume = 1.0;
        utterance.pitch = 1.0;
        
        // Use a clear voice if available
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        
        window.speechSynthesis.speak(utterance);
        this.presentToast('Playing audio instructions...');
      } else {
        this.presentToast('Text-to-speech not supported on this device');
      }
    } catch (error) {
      console.error('Error playing audio instructions:', error);
      this.presentToast('Error playing audio instructions');
    }
  }

  /**
   * Copy emergency instructions to clipboard
   */
  async copyInstructions() {
    const instructionsText = this.getEmergencyInstructionDisplay();
    if (!instructionsText) {
      this.presentToast('No emergency instructions to copy');
      return;
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(instructionsText);
        this.presentToast('Emergency instructions copied to clipboard');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = instructionsText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.presentToast('Emergency instructions copied to clipboard');
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.presentToast('Error copying instructions');
    }
  }

  async saveEmergencyMessage() {
    if (!this.userProfile) {
      this.presentToast('User profile not loaded');
      return;
    }

    try {
      // Update emergency message with current user data if fields are empty
      if (!this.emergencyMessage.name) {
        this.emergencyMessage.name = this.getUserDisplayName();
      }
      if (!this.emergencyMessage.allergies) {
        this.emergencyMessage.allergies = this.getUserAllergiesDisplay();
      }
      
      // Use the medical service to save emergency message
      await this.medicalService.updateEmergencyMessage(this.userProfile.uid, this.emergencyMessage);
      
      // Also update the user profile service for consistency
      await this.userService.updateUserProfile(this.userProfile.uid, {
        emergencyMessage: this.emergencyMessage
      });
      
      this.showEditEmergencyMessageModal = false;
      this.presentToast('Emergency message saved successfully');
    } catch (error) {
      console.error('Error saving emergency message:', error);
      this.presentToast('Error saving emergency message');
    }
  }

  async saveEmergencySettings() {
    if (!this.userProfile) {
      this.presentToast('User profile not loaded');
      return;
    }

    try {
      // Save emergency settings using medical service
      await this.medicalService.saveEmergencySettings(this.userProfile.uid, this.emergencySettings);
      
      // Also update the user profile service for consistency
      await this.userService.updateUserProfile(this.userProfile.uid, {
        emergencySettings: this.emergencySettings
      });
      
      this.presentToast('Emergency settings saved successfully');
    } catch (error) {
      console.error('Error saving emergency settings:', error);
      this.presentToast('Error saving emergency settings');
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

  getEmergencyInstructionDisplay(): string {
    // Use the per-allergy emergency instructions as the primary source
    if (this.emergencyInstructions && this.emergencyInstructions.length > 0) {
      return this.emergencyInstructions
        .map(instruction => `${instruction.allergyName}: ${instruction.instruction}`)
        .join(' | ');
    }
    
    // Return empty string if no specific instructions are set
    return '';
  }

  getEmergencyMessageName(): string {
    return this.emergencyMessage.name || this.getUserDisplayName();
  }

  getEmergencyMessageAllergies(): string {
    return this.emergencyMessage.allergies || this.getUserAllergiesDisplay();
  }

  /**
   * Auto-generate emergency message instructions from per-allergy instructions
   */
  getEmergencyMessageInstructions(): string {
    // Use the detailed per-allergy instructions if available
    if (this.emergencyInstructions && this.emergencyInstructions.length > 0) {
      const firstInstruction = this.emergencyInstructions[0];
      return firstInstruction.instruction;
    }
    
    // Fallback to basic instruction
    return this.emergencyMessage.instructions || 'Use EpiPen immediately and call 911';
  }

  getEmergencyMessageLocation(): string {
    return this.emergencyMessage.location || 'Google Maps';
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

  /**
   * Test emergency alert system
   */
  async testEmergencyAlert() {
    try {
      await this.emergencyAlertService.triggerEmergencyAlert('manual');
      this.presentToast('Emergency alert test sent successfully');
    } catch (error) {
      console.error('Error testing emergency alert:', error);
      this.presentToast('Error testing emergency alert');
    }
  }

  /**
   * Preview emergency message that would be sent
   */
  async previewEmergencyMessage() {
    try {
      if (!this.userProfile) {
        this.presentToast('User profile not loaded');
        return;
      }

      const name = this.getEmergencyMessageName();
      const allergies = this.getEmergencyMessageAllergies();
      const instructions = this.getEmergencyMessageInstructions();
      const location = this.getEmergencyMessageLocation();
      
      const message = `🚨 EMERGENCY ALERT 🚨

Name: ${name}
Allergies: ${allergies}
Instructions: ${instructions}
Location: ${location}

This message would be sent to emergency contacts and responders.`;
      
      const alert = await this.alertController.create({
        header: 'Emergency Message Preview',
        message: message,
        buttons: ['OK']
      });
      await alert.present();
      
    } catch (error) {
      console.error('Error previewing emergency message:', error);
      this.presentToast('Error previewing emergency message');
    }
  }

  /**
   * Play audio instructions if available
   */
  async playAudioInstructions() {
    try {
      if (!this.userProfile) {
        this.presentToast('User profile not loaded');
        return;
      }

      const emergencyData = await this.medicalService.getEmergencyData(this.userProfile.uid);
      await this.emergencyAlertService.playAudioInstructions(emergencyData);
      
    } catch (error) {
      console.error('Error playing audio instructions:', error);
      this.presentToast('Error playing audio instructions');
    }
  }

  /**
   * Show emergency examples modal
   */
  showEmergencyExamples() {
    this.showExamplesModal = true;
  }

  /**
   * Copy example emergency instruction
   */
  async copyExample(exampleType: string) {
    const examples = {
      'simple1': "I have a severe peanut allergy. Use my EpiPen and call 911 immediately.",
      'simple2': "Give me an antihistamine (Cetirizine) if I'm having trouble breathing.",
      'simple3': "I'm allergic to shellfish. If I faint or have hives, use the auto-injector in my bag.",
      'detailed1': "This person is allergic to peanuts. If they are having trouble breathing, give them an EpiPen (in left pocket) immediately. Call emergency services (911). Stay with them until help arrives.",
      'medication1': "I'm allergic to bee stings. If I collapse or stop responding, inject my EpiPen in the thigh and call emergency services. I also carry Benadryl in my pouch.",
      'child1': "Child has a dairy allergy. If symptoms like vomiting or hives appear, administer antihistamine syrup. If breathing difficulty occurs, use EpiPen and call emergency help."
    };

    const exampleText = examples[exampleType as keyof typeof examples];
    
    if (exampleText) {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(exampleText);
          this.presentToast('Example copied to clipboard');
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = exampleText;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          this.presentToast('Example copied to clipboard');
        }
      } catch (error) {
        console.error('Error copying example:', error);
        this.presentToast('Error copying example');
      }
    }
  }

  /**
   * Add emergency instruction for selected allergy
   */
  async addEmergencyInstruction() {
    if (!this.userProfile || !this.selectedAllergyForInstruction || !this.newInstructionText) {
      this.presentToast('Please select an allergy and enter instruction');
      return;
    }

    try {
      await this.medicalService.setEmergencyInstructionForAllergy(
        this.userProfile.uid,
        this.selectedAllergyForInstruction.name,
        this.selectedAllergyForInstruction.label || this.selectedAllergyForInstruction.name,
        this.newInstructionText
      );

      // Reload instructions
      await this.loadEmergencyInstructions();

      // Reset form
      this.selectedAllergyForInstruction = null;
      this.newInstructionText = '';

      this.presentToast('Emergency instruction added successfully');
    } catch (error) {
      console.error('Error adding emergency instruction:', error);
      this.presentToast('Error adding emergency instruction');
    }
  }

  /**
   * Remove emergency instruction for allergy
   */
  async removeEmergencyInstruction(allergyId: string) {
    if (!this.userProfile) return;

    try {
      await this.medicalService.removeEmergencyInstructionForAllergy(this.userProfile.uid, allergyId);
      await this.loadEmergencyInstructions();
      this.presentToast('Emergency instruction removed');
    } catch (error) {
      console.error('Error removing emergency instruction:', error);
      this.presentToast('Error removing emergency instruction');
    }
  }

  /**
   * Open add medication modal
   */
  async openAddMedicationModal() {
    const modal = await this.modalController.create({
      component: AddMedicationModal,
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.saved) {
        this.loadUserMedications(); // Refresh medications list
      }
    });

    await modal.present();
  }

  /**
   * Delete medication
   */
  async deleteMedication(medicationId: string | undefined) {
    if (!medicationId) {
      this.presentToast('Cannot delete medication - missing ID');
      return;
    }

    try {
      await this.medicationService.deleteMedication(medicationId);
      await this.loadUserMedications();
      this.presentToast('Medication removed');
    } catch (error) {
      console.error('Error removing medication:', error);
      this.presentToast('Error removing medication');
    }
  }

  /**
   * Toggle medication active status
   */
  async toggleMedicationStatus(medicationId: string | undefined) {
    if (!medicationId) {
      this.presentToast('Cannot update medication - missing ID');
      return;
    }

    try {
      await this.medicationService.toggleMedicationStatus(medicationId);
      await this.loadUserMedications();
      this.presentToast('Medication status updated');
    } catch (error) {
      console.error('Error updating medication status:', error);
      this.presentToast('Error updating medication status');
    }
  }

  /**
   * Get category color for chips
   */
  getCategoryColor(category: string): string {
    switch (category) {
      case 'allergy':
      case 'emergency':
        return 'danger';
      case 'daily':
        return 'primary';
      case 'asNeeded':
        return 'warning';
      default:
        return 'medium';
    }
  }

  /**
   * Get category label for display
   */
  getCategoryLabel(category: string): string {
    switch (category) {
      case 'allergy':
        return 'Allergy';
      case 'emergency':
        return 'Emergency';
      case 'daily':
        return 'Daily';
      case 'asNeeded':
        return 'As Needed';
      default:
        return 'Other';
    }
  }

  // EHR Methods
  async loadEHRData() {
    try {
      // Load doctor visits from their subcollection
      this.doctorVisits = await this.ehrService.getDoctorVisits();
      
      // Load medical history from their subcollection
      this.medicalHistory = await this.ehrService.getMedicalHistory();
      
      // Load emergency contacts from their subcollection
      this.emergencyContacts = await this.ehrService.getEmergencyContacts();
      
      // Load EHR access list from main EHR record
      const ehrRecord = await this.ehrService.getEHRRecord();
      this.ehrAccessList = ehrRecord?.accessibleBy || [];
      
      // Load healthcare providers with roles
      this.healthcareProviders = await this.ehrService.getHealthcareProviders();
      
      console.log('Loaded EHR data:');
      console.log('- Doctor visits:', this.doctorVisits.length);
      console.log('- Medical history:', this.medicalHistory.length);
      console.log('- Emergency contacts:', this.emergencyContacts.length);
      console.log('- EHR access list:', this.ehrAccessList.length);
      console.log('- Healthcare providers:', this.healthcareProviders.length);
      
    } catch (error) {
      console.error('Error loading EHR data:', error);
    }
  }

  async openAddDoctorVisitModal() {
    const modal = await this.modalController.create({
      component: AddDoctorVisitModal,
      cssClass: 'fullscreen-modal'
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        await this.loadEHRData();
      }
    });

    return await modal.present();
  }

  getVisitTypeColor(type: string): string {
    switch (type) {
      case 'routine': return 'primary';
      case 'urgent': return 'warning';
      case 'emergency': return 'danger';
      case 'follow-up': return 'secondary';
      case 'specialist': return 'tertiary';
      default: return 'medium';
    }
  }

  hasVitalSigns(visit: DoctorVisit): boolean;
  hasVitalSigns(vitalSigns: any): boolean;
  hasVitalSigns(visitOrVitalSigns: DoctorVisit | any): boolean {
    if (visitOrVitalSigns && typeof visitOrVitalSigns === 'object') {
      // If it's a DoctorVisit object
      if ('vitalSigns' in visitOrVitalSigns) {
        const vitalSigns = visitOrVitalSigns.vitalSigns;
        return !!(vitalSigns?.bloodPressure || vitalSigns?.heartRate || 
                  vitalSigns?.temperature || vitalSigns?.weight);
      }
      // If it's vitalSigns directly
      else {
        return !!(visitOrVitalSigns?.bloodPressure || visitOrVitalSigns?.heartRate || 
                  visitOrVitalSigns?.temperature || visitOrVitalSigns?.weight);
      }
    }
    return false;
  }

  getRecentVisits(): DoctorVisit[] {
    return this.doctorVisits
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
      .slice(0, 3);
  }

  getActiveConditions(): MedicalHistory[] {
    return this.medicalHistory.filter(history => history.status === 'active');
  }

  getVisitTypeLabel(type: string): string {
    switch (type) {
      case 'routine': return 'Routine Check-up';
      case 'urgent': return 'Urgent Care';
      case 'emergency': return 'Emergency';
      case 'follow-up': return 'Follow-up';
      case 'specialist': return 'Specialist';
      default: return 'Other';
    }
  }

  async editDoctorVisit(visit: DoctorVisit) {
    const modal = await this.modalController.create({
      component: AddDoctorVisitModal,
      componentProps: {
        visit: visit
      },
      cssClass: 'fullscreen-modal'
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        await this.loadEHRData();
      }
    });

    return await modal.present();
  }

  async deleteDoctorVisit(visitId: string) {
    try {
      await this.ehrService.deleteDoctorVisit(visitId);
      await this.loadEHRData();
      
      const toast = await this.toastController.create({
        message: 'Doctor visit deleted successfully',
        duration: 2000,
        color: 'success'
      });
      toast.present();
    } catch (error) {
      console.error('Error deleting doctor visit:', error);
      const toast = await this.toastController.create({
        message: 'Error deleting doctor visit',
        duration: 2000,
        color: 'danger'
      });
      toast.present();
    }
  }

  async openAddMedicalHistoryModal() {
    const modal = await this.modalController.create({
      component: AddMedicalHistoryModal,
      componentProps: {}
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.loadEHRData(); // Refresh the data
      }
    });

    return await modal.present();
  }

  getHistoryStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'danger';
      case 'resolved': return 'success';
      case 'chronic': return 'warning';
      default: return 'medium';
    }
  }

  async openAddEmergencyContactModal() {
    const modal = await this.modalController.create({
      component: AddEmergencyContactModal,
      componentProps: {}
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.loadEHRData(); // Refresh the data
      }
    });

    return await modal.present();
  }

  async editMedicalHistory(history: MedicalHistory) {
    const modal = await this.modalController.create({
      component: AddMedicalHistoryModal,
      componentProps: {
        medicalHistory: history,
        isEditMode: true
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.loadEHRData(); // Refresh the data
      }
    });

    return await modal.present();
  }

  async editEmergencyContact(contact: EmergencyContact) {
    const modal = await this.modalController.create({
      component: AddEmergencyContactModal,
      componentProps: {
        emergencyContact: contact,
        isEditMode: true
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.loadEHRData(); // Refresh the data
      }
    });

    return await modal.present();
  }

  async grantEHRAccess() {
    if (!this.newProviderEmail || !this.newProviderEmail.trim()) {
      this.presentToast('Please enter provider email');
      return;
    }

    try {
      await this.ehrService.grantEHRAccess(this.newProviderEmail.trim());
      await this.loadEHRData(); // Refresh the access list
      this.newProviderEmail = ''; // Clear the input
      this.presentToast('EHR access granted successfully');
    } catch (error) {
      console.error('Error granting EHR access:', error);
      this.presentToast('Error granting EHR access');
    }
  }

  /**
   * Grant enhanced healthcare provider access with role
   */
  async grantHealthcareProviderAccess() {
    if (!this.newProviderEmail?.trim() || !this.newProviderName?.trim()) {
      this.presentToast('Please enter provider email and name');
      return;
    }

    try {
      await this.ehrService.grantHealthcareProviderAccess(
        this.newProviderEmail.trim(),
        this.newProviderRole,
        this.newProviderName.trim(),
        this.newProviderLicense?.trim(),
        this.newProviderSpecialty?.trim(),
        this.newProviderHospital?.trim()
      );
      
      await this.loadEHRData(); // Refresh the data
      
      // Clear the form
      this.newProviderEmail = '';
      this.newProviderName = '';
      this.newProviderRole = 'doctor';
      this.newProviderLicense = '';
      this.newProviderSpecialty = '';
      this.newProviderHospital = '';
      
      this.presentToast('Healthcare provider access granted successfully');
    } catch (error) {
      console.error('Error granting healthcare provider access:', error);
      this.presentToast('Error granting healthcare provider access');
    }
  }

  /**
   * Revoke healthcare provider access
   */
  async revokeHealthcareProviderAccess(providerEmail: string) {
    try {
      await this.ehrService.revokeHealthcareProviderAccess(providerEmail);
      await this.loadEHRData(); // Refresh the data
      this.presentToast('Healthcare provider access revoked successfully');
    } catch (error) {
      console.error('Error revoking healthcare provider access:', error);
      this.presentToast('Error revoking healthcare provider access');
    }
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(role: 'doctor' | 'nurse'): string {
    return role === 'doctor' ? 'Doctor' : 'Nurse';
  }

  /**
   * Get role color for chips
   */
  getRoleColor(role: 'doctor' | 'nurse'): string {
    return role === 'doctor' ? 'primary' : 'secondary';
  }

  /**
   * Navigate to doctor dashboard for professional workflow
   */
  async navigateToDoctorDashboard() {
    try {
      // Check if current user has professional role
      const currentUser = await this.authService.waitForAuthInit();
      if (currentUser && this.userProfile) {
        if (this.userProfile.role === 'doctor' || this.userProfile.role === 'nurse') {
          await this.router.navigate(['/doctor-dashboard']);
        } else {
          this.presentToast('Access denied. Professional privileges required.');
        }
      } else {
        this.presentToast('Please log in to access professional dashboard');
      }
    } catch (error) {
      console.error('Error navigating to doctor dashboard:', error);
      this.presentToast('Error accessing professional dashboard');
    }
  }

  async revokeEHRAccess(providerEmail: string) {
    try {
      await this.ehrService.revokeEHRAccess(providerEmail);
      await this.loadEHRData(); // Refresh the access list
      this.presentToast('EHR access revoked successfully');
    } catch (error) {
      console.error('Error revoking EHR access:', error);
      this.presentToast('Error revoking EHR access');
    }
  }

  /**
   * Load pending access requests for doctors/nurses
   */
  async loadAccessRequests() {
    try {
      console.log('Loading access requests for healthcare provider');
      this.pendingRequests = await this.ehrService.getPendingAccessRequests();
      console.log('Loaded access requests:', this.pendingRequests.length);
    } catch (error) {
      console.error('Error loading access requests:', error);
      this.presentToast('Error loading access requests');
    }
  }

  /**
   * Accept an access request from a patient
   */
  async acceptAccessRequest(request: AccessRequest) {
    const alert = await this.alertController.create({
      header: 'Accept Access Request',
      message: `Accept access to ${request.patientName}'s medical records? You will be able to view their complete EHR including allergies, medications, and visit history.`,
      inputs: [
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Optional notes about accepting this patient...'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Accept Patient',
          handler: async (data) => {
            try {
              await this.ehrService.respondToAccessRequest(request.id!, 'accepted', data.notes);
              await this.presentToast(`Access granted to ${request.patientName}`);
              await this.loadAccessRequests(); // Refresh the list
            } catch (error) {
              console.error('Error accepting request:', error);
              await this.presentToast('Error accepting request. Please try again.');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Decline an access request from a patient
   */
  async declineAccessRequest(request: AccessRequest) {
    const alert = await this.alertController.create({
      header: 'Decline Access Request',
      message: `Decline access request from ${request.patientName}? They will be notified that you declined to access their medical records.`,
      inputs: [
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Optional reason for declining (patient will not see this)...'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Decline Request',
          handler: async (data) => {
            try {
              await this.ehrService.respondToAccessRequest(request.id!, 'declined', data.notes);
              await this.presentToast(`Request from ${request.patientName} declined`);
              await this.loadAccessRequests(); // Refresh requests list
            } catch (error) {
              console.error('Error declining request:', error);
              await this.presentToast('Error declining request. Please try again.');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Get human-readable age of the request
   */
  getRequestAge(requestDate: Date | any): string {
    const now = new Date();
    const reqDate = new Date(requestDate);
    const diffTime = Math.abs(now.getTime() - reqDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week(s) ago`;
    return `${Math.floor(diffDays / 30)} month(s) ago`;
  }

  /**
   * Get human-readable expiry date
   */
  getExpiryDate(expiryDate: Date | any): string {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} week(s)`;
    return `In ${Math.floor(diffDays / 30)} month(s)`;
  }

  /**
   * Cleanup method to prevent memory leaks
   */
  ngOnDestroy() {
    // Clear any timeouts
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Clear caches
    this.clearMedicationCache();
    
    // Stop any ongoing speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
