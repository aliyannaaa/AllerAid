import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebase.config';

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Buddy {
  id?: string;
  userId: string; // User who added this buddy
  firstName: string;
  lastName: string;
  relationship: string;
  contactNumber: string;
  email?: string;
  isEmergencyContact?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BuddyService {
  private db;
  
  // Observable for active emergency alerts for the current user's buddies
  private activeEmergencyAlertsSubject = new BehaviorSubject<any[]>([]);
  activeEmergencyAlerts$ = this.activeEmergencyAlertsSubject.asObservable();

  constructor() {
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  // CREATE buddy
  async addBuddy(buddy: any): Promise<string> {
    const docRef = await addDoc(collection(this.db, 'buddies'), buddy);
    return docRef.id;
  }

  // READ all buddies
  async getBuddies(): Promise<any[]> {
    const querySnapshot = await getDocs(collection(this.db, 'buddies'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // UPDATE buddy
  async updateBuddy(id: string, updatedData: any): Promise<void> {
    const buddyDoc = doc(this.db, 'buddies', id);
    await updateDoc(buddyDoc, updatedData);
  }

  // DELETE buddy
  async deleteBuddy(id: string): Promise<void> {
    const buddyDoc = doc(this.db, 'buddies', id);
    await deleteDoc(buddyDoc);
  }

  // READ buddies for specific user
  async getUserBuddies(userId: string): Promise<any[]> {
    try {
      console.log('Fetching buddies for userId:', userId); // Debug log
      
      // Use a proper Firestore query instead of fetching all and filtering
      const q = query(
        collection(this.db, 'buddies'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const userBuddies = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      console.log('Found buddies:', userBuddies); // Debug log
      console.log('Number of buddies found:', userBuddies.length); // Additional debug
      return userBuddies;
    } catch (error) {
      console.error('Error fetching user buddies:', error);
      return [];
    }
  }

  // Helper method to debug all buddies (for troubleshooting)
  async debugAllBuddies(): Promise<void> {
    try {
      const querySnapshot = await getDocs(collection(this.db, 'buddies'));
      const allBuddies = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      console.log('DEBUG - All buddies in database:', allBuddies);
    } catch (error) {
      console.error('Error debugging buddies:', error);
    }
  }
  
  // Get a specific buddy by ID
  async getBuddyById(buddyId: string): Promise<Buddy | null> {
    try {
      const buddyDoc = doc(this.db, 'buddies', buddyId);
      const buddySnap = await getDoc(buddyDoc);
      
      if (buddySnap.exists()) {
        return { id: buddySnap.id, ...buddySnap.data() } as Buddy;
      }
      return null;
    } catch (error) {
      console.error('Error getting buddy by ID:', error);
      return null;
    }
  }
  
  // Check if the current buddy ID is in any active emergencies
  listenForEmergencyAlerts(buddyId: string): void {
    const emergenciesRef = collection(this.db, 'emergencies');
    
    // Query for active emergencies that include this buddy ID
    const q = query(
      emergenciesRef,
      where('buddyIds', 'array-contains', buddyId),
      where('status', 'in', ['active', 'responding'])
    );
    
    // Set up real-time listener
    onSnapshot(q, (querySnapshot) => {
      const emergencies: any[] = [];
      querySnapshot.forEach((doc) => {
        emergencies.push({ id: doc.id, ...doc.data() });
      });
      this.activeEmergencyAlertsSubject.next(emergencies);
    });
  }
  
  // Respond to an emergency alert (for buddies)
  async respondToEmergency(emergencyId: string, buddyId: string, buddyName: string): Promise<void> {
    try {
      const emergencyRef = doc(this.db, 'emergencies', emergencyId);
      
      // Update the emergency status
      await updateDoc(emergencyRef, {
        status: 'responding',
        responderId: buddyId,
        responderName: buddyName
      });
    } catch (error) {
      console.error('Error responding to emergency:', error);
      throw error;
    }
  }
}
