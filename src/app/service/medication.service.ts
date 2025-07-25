import { Injectable } from '@angular/core';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';

export interface Medication {
  id?: string;
  name: string;
  dosage: string;
  frequency: string; // We'll use this for duration (e.g., "10 days")
  startDate: string;
  endDate?: string;
  notes: string;
  category: 'allergy' | 'emergency' | 'daily' | 'asNeeded' | 'other';
  isActive: boolean;
  prescribedBy?: string;
  sideEffects?: string;
  instructions?: string;
  refillDate?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Enhanced fields (all optional for simplified form)
  medicationType?: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'inhaler' | 'cream' | 'drops' | 'patch' | 'other';
  strength?: string;
  route?: 'oral' | 'topical' | 'injection' | 'inhalation' | 'nasal' | 'ophthalmic' | 'otic';
  color?: string;
  shape?: string;
  manufacturer?: string;
  lotNumber?: string;
  expiryDate?: string;
  quantity?: number; // Number of pills
  unitCost?: number;
  totalCost?: number;
  pharmacy?: string;
  prescriptionNumber?: string;
  refillsRemaining?: number;
  reminderEnabled?: boolean;
  reminderTimes?: string[];
  allergicReaction?: boolean;
  emergencyMedication?: boolean;
  requiresRefrigeration?: boolean;
  withFood?: boolean;
  foodRestrictions?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MedicationService {
  private db;

  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService
  ) {
    this.db = this.firebaseService.getDb();
  }

  /**
   * Add a new medication for the current user
   */
  async addMedication(medication: Medication): Promise<void> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const medsRef = collection(this.db, `users/${currentUser.uid}/medications`);
      await addDoc(medsRef, {
        ...medication,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      console.log('Medication added successfully');
    } catch (error) {
      console.error('Error adding medication:', error);
      throw error;
    }
  }

  /**
   * Get all medications for the current user
   */
  async getUserMedications(uid?: string): Promise<Medication[]> {
    const currentUser = await this.authService.waitForAuthInit();
    const userId = uid || currentUser?.uid;
    
    if (!userId) {
      throw new Error('User not logged in');
    }

    try {
      const medsRef = collection(this.db, `users/${userId}/medications`);
      const q = query(medsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const medications: Medication[] = [];
      querySnapshot.forEach((doc) => {
        medications.push({ id: doc.id, ...doc.data() } as Medication);
      });
      
      return medications;
    } catch (error) {
      console.error('Error getting medications:', error);
      throw error;
    }
  }

  /**
   * Update an existing medication
   */
  async updateMedication(medicationId: string, updates: Partial<Medication>): Promise<void> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const medRef = doc(this.db, `users/${currentUser.uid}/medications/${medicationId}`);
      await updateDoc(medRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      console.log('Medication updated successfully');
    } catch (error) {
      console.error('Error updating medication:', error);
      throw error;
    }
  }

  /**
   * Delete a medication
   */
  async deleteMedication(medicationId: string): Promise<void> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const medRef = doc(this.db, `users/${currentUser.uid}/medications/${medicationId}`);
      await deleteDoc(medRef);
      
      console.log('Medication deleted successfully');
    } catch (error) {
      console.error('Error deleting medication:', error);
      throw error;
    }
  }

  /**
   * Get medications by category
   */
  async getUserMedicationsByCategory(category: string): Promise<Medication[]> {
    const allMedications = await this.getUserMedications();
    return allMedications.filter(med => med.category === category);
  }

  /**
   * Get only active medications
   */
  async getActiveMedications(): Promise<Medication[]> {
    const allMedications = await this.getUserMedications();
    return allMedications.filter(med => med.isActive);
  }

  /**
   * Get emergency medications (priority medications)
   */
  async getEmergencyMedications(): Promise<Medication[]> {
    const allMedications = await this.getUserMedications();
    return allMedications.filter(med => 
      med.category === 'emergency' || 
      med.category === 'allergy'
    );
  }

  /**
   * Toggle medication active status
   */
  async toggleMedicationStatus(medicationId: string): Promise<void> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const medRef = doc(this.db, `users/${currentUser.uid}/medications/${medicationId}`);
      const medDoc = await getDoc(medRef);
      
      if (medDoc.exists()) {
        const currentData = medDoc.data() as Medication;
        await updateDoc(medRef, {
          isActive: !currentData.isActive,
          updatedAt: new Date()
        });
        console.log('Medication status toggled successfully');
      }
    } catch (error) {
      console.error('Error toggling medication status:', error);
      throw error;
    }
  }

  /**
   * Get medications by prescriber
   */
  async getMedicationsByPrescriber(prescriber: string): Promise<Medication[]> {
    const allMedications = await this.getUserMedications();
    return allMedications.filter(med => 
      med.prescribedBy?.toLowerCase().includes(prescriber.toLowerCase())
    );
  }

  /**
   * Search medications by name or notes
   */
  async searchMedications(searchTerm: string): Promise<Medication[]> {
    const allMedications = await this.getUserMedications();
    const term = searchTerm.toLowerCase();
    return allMedications.filter(med => 
      med.name.toLowerCase().includes(term) ||
      med.notes?.toLowerCase().includes(term) ||
      med.dosage.toLowerCase().includes(term)
    );
  }

  /**
   * Get medications expiring soon (within 30 days)
   */
  async getExpiringMedications(): Promise<Medication[]> {
    const allMedications = await this.getUserMedications();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return allMedications.filter(med => {
      if (!med.expiryDate) return false;
      const expiryDate = new Date(med.expiryDate);
      return expiryDate <= thirtyDaysFromNow && med.isActive;
    });
  }

  /**
   * Get medications needing refill
   */
  async getMedicationsNeedingRefill(): Promise<Medication[]> {
    const allMedications = await this.getUserMedications();
    return allMedications.filter(med => 
      med.refillsRemaining !== undefined && 
      med.refillsRemaining <= 1 && 
      med.isActive
    );
  }

  /**
   * Get emergency medications only
   */
  async getEmergencyOnlyMedications(): Promise<Medication[]> {
    const allMedications = await this.getUserMedications();
    return allMedications.filter(med => 
      med.emergencyMedication === true || 
      med.allergicReaction === true
    );
  }

  /**
   * Get medications by type
   */
  async getMedicationsByType(type: string): Promise<Medication[]> {
    const allMedications = await this.getUserMedications();
    return allMedications.filter(med => med.medicationType === type);
  }

  /**
   * Get medications that require special storage
   */
  async getSpecialStorageMedications(): Promise<Medication[]> {
    const allMedications = await this.getUserMedications();
    return allMedications.filter(med => 
      med.requiresRefrigeration === true
    );
  }

  /**
   * Create medication reminder
   */
  async setMedicationReminder(medicationId: string, reminderTimes: string[]): Promise<void> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const medRef = doc(this.db, `users/${currentUser.uid}/medications/${medicationId}`);
      await updateDoc(medRef, {
        reminderEnabled: true,
        reminderTimes: reminderTimes,
        updatedAt: new Date()
      });
      console.log('Medication reminder set successfully');
    } catch (error) {
      console.error('Error setting medication reminder:', error);
      throw error;
    }
  }

  /**
   * Update medication inventory
   */
  async updateMedicationInventory(medicationId: string, quantity: number, cost?: number): Promise<void> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const medRef = doc(this.db, `users/${currentUser.uid}/medications/${medicationId}`);
      const updateData: any = {
        quantity: quantity,
        updatedAt: new Date()
      };
      
      if (cost !== undefined) {
        updateData.unitCost = cost;
        updateData.totalCost = quantity * cost;
      }

      await updateDoc(medRef, updateData);
      console.log('Medication inventory updated successfully');
    } catch (error) {
      console.error('Error updating medication inventory:', error);
      throw error;
    }
  }
}
