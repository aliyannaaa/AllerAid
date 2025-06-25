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
export class FirebaseService {
  private db;

  constructor() {
    const app = initializeApp(firebaseConfig); // Initialize Firebase
    this.db = getFirestore(app);               // Get Firestore instance
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
}
