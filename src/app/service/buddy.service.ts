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
export class BuddyService {
  private db;

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
    const querySnapshot = await getDocs(collection(this.db, 'buddies'));
    const userBuddies = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((buddy: any) => buddy.userId === userId);
    return userBuddies;
  }
}
