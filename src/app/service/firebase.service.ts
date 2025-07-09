import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebase.config';

import {
  getFirestore
} from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private db;

  constructor() {
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  // This service can be used for general Firebase operations
  // or removed if no longer needed since functionality is now
  // separated into AllergyService and BuddyService
  
  getDb() {
    return this.db;
  }
}
