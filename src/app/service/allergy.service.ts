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
    // Allergy options should be created manually in Firebase Console
    // or loaded from an external configuration
    throw new Error('Allergy options should be created manually in Firebase Console');
  }

  // READ all allergy options from Firebase
  async getAllergyOptions(): Promise<any[]> {
    const querySnapshot = await getDocs(collection(this.db, 'allergyOptions'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // DELETE all allergy options from Firebase
  async deleteAllAllergyOptions(): Promise<void> {
    const querySnapshot = await getDocs(collection(this.db, 'allergyOptions'));
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  }

  // DELETE specific allergy option from Firebase
  async deleteAllergyOption(optionId: string): Promise<void> {
    const optionDoc = doc(this.db, 'allergyOptions', optionId);
    await deleteDoc(optionDoc);
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
}
