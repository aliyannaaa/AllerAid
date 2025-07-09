import { Injectable } from '@angular/core';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  emergencyInstruction?: string;
  dateCreated: any;
  lastLogin: any;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private db;

  constructor(
    private firebaseService: FirebaseService,
    private afAuth: AngularFireAuth
  ) {
    this.db = this.firebaseService.getDb();
  }

  // Create user profile in Firestore
  async createUserProfile(uid: string, userData: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<void> {
    try {
      const userProfile: UserProfile = {
        uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        fullName: `${userData.firstName} ${userData.lastName}`,
        dateCreated: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isActive: true
      };

      await setDoc(doc(this.db, 'users', uid), userProfile);
      console.log('User profile created successfully');
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', uid));
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      } else {
        console.log('No user profile found');
        return null;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'users', uid), {
        ...updates,
        lastLogin: serverTimestamp()
      });
      console.log('User profile updated successfully');
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Update last login timestamp
  async updateLastLogin(uid: string): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'users', uid), {
        lastLogin: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  // Get current user profile
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const user = await this.afAuth.currentUser;
      if (user) {
        return await this.getUserProfile(user.uid);
      }
      return null;
    } catch (error) {
      console.error('Error getting current user profile:', error);
      throw error;
    }
  }

  // Delete user profile
  async deleteUserProfile(uid: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, 'users', uid));
      console.log('User profile deleted successfully');
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }
  }

  // Check if user profile exists
  async userProfileExists(uid: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', uid));
      return userDoc.exists();
    } catch (error) {
      console.error('Error checking user profile existence:', error);
      return false;
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const usersRef = collection(this.db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  // Update user avatar
  async updateUserAvatar(uid: string, avatarUrl: string): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'users', uid), {
        avatar: avatarUrl
      });
      console.log('User avatar updated successfully');
    } catch (error) {
      console.error('Error updating user avatar:', error);
      throw error;
    }
  }
}
