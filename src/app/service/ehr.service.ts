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
  where,
  Timestamp
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';

export interface MedicalHistory {
  id?: string;
  patientId: string;
  condition: string;
  diagnosisDate: string;
  status: 'active' | 'resolved' | 'chronic';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmergencyContact {
  id?: string;
  patientId: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  isPrimary: boolean;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DoctorVisit {
  id?: string;
  patientId: string;
  doctorName: string;
  specialty?: string;
  visitDate: string;
  visitType: 'routine' | 'emergency' | 'follow-up' | 'consultation';
  chiefComplaint: string;
  diagnosis: string;
  treatment: string;
  recommendations: string;
  nextAppointment?: string;
  prescriptions?: string[];
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EHRRecord {
  id?: string;
  patientId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    bloodType?: string;
    phoneNumber: string;
    email: string;
    address: string;
  };
  allergies: any[];
  medications: any[];
  medicalHistory: MedicalHistory[];
  emergencyContacts: EmergencyContact[];
  doctorVisits: DoctorVisit[];
  accessibleBy: string[]; // User IDs who can access this EHR
  lastUpdated?: Date;
  createdAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class EHRService {
  private db: any;

  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService
  ) {
    this.db = this.firebaseService.getDb();
  }

  /**
   * Create or update EHR record
   */
  async createOrUpdateEHR(ehrData: Partial<EHRRecord>): Promise<void> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const ehrRef = doc(this.db, `ehr/${currentUser.uid}`);
      const existingEHR = await getDoc(ehrRef);

      const updatedData = {
        ...ehrData,
        patientId: currentUser.uid,
        lastUpdated: new Date()
      };

      if (existingEHR.exists()) {
        await updateDoc(ehrRef, updatedData);
      } else {
        await addDoc(collection(this.db, 'ehr'), {
          ...updatedData,
          createdAt: new Date()
        });
      }

      console.log('EHR record updated successfully');
    } catch (error) {
      console.error('Error updating EHR record:', error);
      throw error;
    }
  }

  /**
   * Get EHR record for current user
   */
  async getEHRRecord(): Promise<EHRRecord | null> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const ehrQuery = query(
        collection(this.db, 'ehr'),
        where('patientId', '==', currentUser.uid)
      );
      const ehrSnapshot = await getDocs(ehrQuery);

      if (!ehrSnapshot.empty) {
        const ehrDoc = ehrSnapshot.docs[0];
        return {
          id: ehrDoc.id,
          ...ehrDoc.data()
        } as EHRRecord;
      }

      return null;
    } catch (error) {
      console.error('Error fetching EHR record:', error);
      throw error;
    }
  }

  /**
   * Add medical history entry
   */
  async addMedicalHistory(historyData: Omit<MedicalHistory, 'id' | 'patientId'>): Promise<void> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      await addDoc(collection(this.db, `ehr/${currentUser.uid}/medicalHistory`), {
        ...historyData,
        patientId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error adding medical history:', error);
      throw error;
    }
  }

  /**
   * Get medical history
   */
  async getMedicalHistory(): Promise<MedicalHistory[]> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const historyQuery = query(
        collection(this.db, `ehr/${currentUser.uid}/medicalHistory`),
        orderBy('diagnosisDate', 'desc')
      );
      const historySnapshot = await getDocs(historyQuery);

      return historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MedicalHistory[];
    } catch (error) {
      console.error('Error fetching medical history:', error);
      throw error;
    }
  }

  /**
   * Add emergency contact
   */
  async addEmergencyContact(contactData: Omit<EmergencyContact, 'id' | 'patientId'>): Promise<void> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      await addDoc(collection(this.db, `ehr/${currentUser.uid}/emergencyContacts`), {
        ...contactData,
        patientId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      throw error;
    }
  }

  /**
   * Get emergency contacts
   */
  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const contactsQuery = query(
        collection(this.db, `ehr/${currentUser.uid}/emergencyContacts`),
        orderBy('isPrimary', 'desc')
      );
      const contactsSnapshot = await getDocs(contactsQuery);

      return contactsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmergencyContact[];
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      throw error;
    }
  }

  /**
   * Add doctor visit
   */
  async addDoctorVisit(visitData: Omit<DoctorVisit, 'id' | 'patientId'>): Promise<void> {
    console.log('EHR Service: Starting addDoctorVisit with data:', visitData);
    
    const currentUser = await this.authService.waitForAuthInit();
    console.log('EHR Service: Current user:', currentUser?.uid);
    
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      // Clean and validate the data before saving
      const cleanedData: any = {
        doctorName: visitData.doctorName?.trim() || '',
        specialty: visitData.specialty?.trim() || '',
        visitDate: visitData.visitDate || new Date().toISOString(),
        visitType: visitData.visitType || 'routine',
        chiefComplaint: visitData.chiefComplaint?.trim() || '',
        diagnosis: visitData.diagnosis?.trim() || '',
        treatment: visitData.treatment?.trim() || '',
        recommendations: visitData.recommendations?.trim() || '',
        nextAppointment: visitData.nextAppointment || '',
        prescriptions: Array.isArray(visitData.prescriptions) ? visitData.prescriptions : [],
        vitalSigns: {},
        notes: visitData.notes?.trim() || '',
        patientId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Only add vital signs fields if they have values (not undefined or empty)
      if (visitData.vitalSigns) {
        if (visitData.vitalSigns.bloodPressure?.trim()) {
          cleanedData.vitalSigns.bloodPressure = visitData.vitalSigns.bloodPressure.trim();
        }
        if (visitData.vitalSigns.heartRate !== undefined && visitData.vitalSigns.heartRate !== null && !isNaN(Number(visitData.vitalSigns.heartRate))) {
          cleanedData.vitalSigns.heartRate = Number(visitData.vitalSigns.heartRate);
        }
        if (visitData.vitalSigns.temperature !== undefined && visitData.vitalSigns.temperature !== null && !isNaN(Number(visitData.vitalSigns.temperature))) {
          cleanedData.vitalSigns.temperature = Number(visitData.vitalSigns.temperature);
        }
        if (visitData.vitalSigns.weight !== undefined && visitData.vitalSigns.weight !== null && !isNaN(Number(visitData.vitalSigns.weight))) {
          cleanedData.vitalSigns.weight = Number(visitData.vitalSigns.weight);
        }
        if (visitData.vitalSigns.height !== undefined && visitData.vitalSigns.height !== null && !isNaN(Number(visitData.vitalSigns.height))) {
          cleanedData.vitalSigns.height = Number(visitData.vitalSigns.height);
        }
      }
      
      console.log('EHR Service: Cleaned document data to save:', cleanedData);
      
      const docRef = await addDoc(collection(this.db, `ehr/${currentUser.uid}/doctorVisits`), cleanedData);
      console.log('EHR Service: Doctor visit added successfully with ID:', docRef.id);
    } catch (error) {
      console.error('EHR Service: Detailed error adding doctor visit:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Get doctor visits
   */
  async getDoctorVisits(): Promise<DoctorVisit[]> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const visitsQuery = query(
        collection(this.db, `ehr/${currentUser.uid}/doctorVisits`),
        orderBy('visitDate', 'desc')
      );
      const visitsSnapshot = await getDocs(visitsQuery);

      return visitsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DoctorVisit[];
    } catch (error) {
      console.error('Error fetching doctor visits:', error);
      throw error;
    }
  }

  /**
   * Update doctor visit
   */
  async updateDoctorVisit(visitId: string, visitData: Partial<DoctorVisit>): Promise<void> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const visitRef = doc(this.db, `ehr/${currentUser.uid}/doctorVisits/${visitId}`);
      await updateDoc(visitRef, {
        ...visitData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating doctor visit:', error);
      throw error;
    }
  }

  /**
   * Delete doctor visit
   */
  async deleteDoctorVisit(visitId: string): Promise<void> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const visitRef = doc(this.db, `ehr/${currentUser.uid}/doctorVisits/${visitId}`);
      await deleteDoc(visitRef);
    } catch (error) {
      console.error('Error deleting doctor visit:', error);
      throw error;
    }
  }

  /**
   * Grant access to EHR for healthcare provider
   */
  async grantEHRAccess(providerEmail: string): Promise<void> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const ehrRecord = await this.getEHRRecord();
      if (ehrRecord) {
        const currentAccess = ehrRecord.accessibleBy || [];
        if (!currentAccess.includes(providerEmail)) {
          currentAccess.push(providerEmail);
          await this.createOrUpdateEHR({
            accessibleBy: currentAccess
          });
        }
      }
    } catch (error) {
      console.error('Error granting EHR access:', error);
      throw error;
    }
  }

  /**
   * Revoke access to EHR
   */
  async revokeEHRAccess(providerEmail: string): Promise<void> {
    const currentUser = await this.authService.waitForAuthInit();
    if (!currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const ehrRecord = await this.getEHRRecord();
      if (ehrRecord) {
        const currentAccess = ehrRecord.accessibleBy || [];
        const updatedAccess = currentAccess.filter(email => email !== providerEmail);
        await this.createOrUpdateEHR({
          accessibleBy: updatedAccess
        });
      }
    } catch (error) {
      console.error('Error revoking EHR access:', error);
      throw error;
    }
  }
}
