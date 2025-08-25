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
  doc
} from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class AllergyService {
  private db;

  constructor() {
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  // CREATE allergy profile for user
  async addUserAllergies(userId: string, allergies: any[]): Promise<string> {
    const allergyData = {
      userId: userId,
      allergies: allergies,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const docRef = await addDoc(collection(this.db, 'allergies'), allergyData);
    return docRef.id;
  }

  // READ user allergies
  async getUserAllergies(userId: string): Promise<any[]> {
    const querySnapshot = await getDocs(collection(this.db, 'allergies'));
    const userAllergies = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((allergy: any) => allergy.userId === userId);
    return userAllergies;
  }

  // UPDATE user allergies
  async updateUserAllergies(allergyDocId: string, allergies: any[]): Promise<void> {
    const allergyDoc = doc(this.db, 'allergies', allergyDocId);
    await updateDoc(allergyDoc, { 
      allergies: allergies,
      updatedAt: new Date()
    });
  }

  // DELETE user allergies
  async deleteUserAllergies(allergyDocId: string): Promise<void> {
    const allergyDoc = doc(this.db, 'allergies', allergyDocId);
    await deleteDoc(allergyDoc);
  }

  // CREATE predefined allergy options (run once to populate Firebase)
  async createAllergyOptions(): Promise<void> {
    try {
      // First, delete all existing allergy options
      const querySnapshot = await getDocs(collection(this.db, 'allergyOptions'));
      const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(doc(this.db, 'allergyOptions', docSnap.id)));
      await Promise.all(deletePromises);

      // Now, add the allergy options in the correct order
      const allergyOptions = [
        { name: 'peanuts', label: 'Peanuts/Nuts', hasInput: false, order: 1 },
        { name: 'dairy', label: 'Dairy/Milk', hasInput: false, order: 2 },
        { name: 'eggs', label: 'Eggs', hasInput: false, order: 3 },
        { name: 'wheat', label: 'Wheat/Gluten', hasInput: false, order: 4 },
        { name: 'fish', label: 'Fish', hasInput: false, order: 5 },
        { name: 'shellfish', label: 'Shellfish', hasInput: false, order: 6 },
        { name: 'soy', label: 'Soy', hasInput: false, order: 7 },
        { name: 'pollen', label: 'Pollen', hasInput: false, order: 8 },
        { name: 'latex', label: 'Latex', hasInput: false, order: 9 },
        { name: 'animalDander', label: 'Animal Dander', hasInput: false, order: 10 },
        { name: 'insectStings', label: 'Insect Stings', hasInput: false, order: 11 },
        { name: 'medication', label: 'Medication', hasInput: true, order: 12 },
        { name: 'others', label: 'Others', hasInput: true, order: 13 }
      ];

      for (const option of allergyOptions) {
        await addDoc(collection(this.db, 'allergyOptions'), option);
      }
      console.log('Allergy options reset and created successfully in Firebase');
    } catch (error) {
      console.error('Error resetting/creating allergy options:', error);
      throw error;
    }
  }

  // READ all allergy options from Firebase
  async getAllergyOptions(): Promise<any[]> {
    try {
      // Use Firestore's orderBy to guarantee correct order
      const allergyOptionsRef = collection(this.db, 'allergyOptions');
      // Import query and orderBy from firebase/firestore if not already
      // import { query, orderBy } from 'firebase/firestore';
      const { query, orderBy } = await import('firebase/firestore');
      const q = query(allergyOptionsRef, orderBy('order'));
      const querySnapshot = await getDocs(q);
      const options = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Retrieved', options.length, 'allergy options from Firebase (ordered by order field)');
      return options;
    } catch (error) {
      console.error('Error fetching allergy options:', error);
      throw error;
    }
  }

  // CHECK if user has specific allergy
  async userHasAllergy(userId: string, allergyName: string): Promise<boolean> {
    const userAllergies = await this.getUserAllergies(userId);
    return userAllergies.some((allergyDoc: any) => 
      allergyDoc.allergies.some((allergy: any) => 
        allergy.name === allergyName && allergy.checked
      )
    );
  }

  // GET user's allergy list (flattened)
  async getUserAllergyList(userId: string): Promise<string[]> {
    const userAllergies = await this.getUserAllergies(userId);
    const allergyList: string[] = [];
    
    userAllergies.forEach((allergyDoc: any) => {
      allergyDoc.allergies.forEach((allergy: any) => {
        if (allergy.checked) {
          allergyList.push(allergy.label || allergy.name);
        }
      });
    });
    
    return allergyList;
  }

  // CLEAR all user allergies
  async clearUserAllergies(userId: string): Promise<void> {
    const userAllergies = await this.getUserAllergies(userId);
    const deletePromises = userAllergies.map(allergyDoc => 
      this.deleteUserAllergies(allergyDoc.id)
    );
    await Promise.all(deletePromises);
  }

  // ADD single allergy for user
  async addUserAllergy(userId: string, allergy: any): Promise<string> {
    const allergyData = {
      userId: userId,
      allergies: [allergy],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const docRef = await addDoc(collection(this.db, 'allergies'), allergyData);
    return docRef.id;
  }

  // UTILITY: Reset allergy options (delete all and recreate top-level collection)
  async resetAllergyOptions(): Promise<void> {
    // Delete all top-level allergyOptions documents
    const querySnapshot = await getDocs(collection(this.db, 'allergyOptions'));
    const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(doc(this.db, 'allergyOptions', docSnap.id)));
    await Promise.all(deletePromises);
    // Repopulate top-level allergyOptions
    await this.createAllergyOptions();
    console.log('Allergy options reset and repopulated at top-level collection.');
  }
}

