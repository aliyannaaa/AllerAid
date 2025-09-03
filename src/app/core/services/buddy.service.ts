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
  // ...existing code...
}

export interface BuddyInvitation {
  id?: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  toUserId: string;
  toUserEmail: string;
  toUserName: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: Date;
  respondedAt?: Date;
}

export interface BuddyRelation {
  id?: string;
  user1Id: string;
  user2Id: string;
  status: 'pending' | 'accepted';
  invitationId: string;
  createdAt: Date;
  acceptedAt?: Date;
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

  // INVITATION METHODS

  // Send buddy invitation (updated for email-based invitations)
  async sendBuddyInvitation(
    toUserEmail: string, 
    toUserName: string, 
    message: string
  ): Promise<void> {
    try {
      // Get current user info
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      const invitation: Omit<BuddyInvitation, 'id'> = {
        fromUserId: currentUser.uid,
        fromUserName: currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`,
        fromUserEmail: currentUser.email,
        toUserId: '', // Will be set when recipient registers
        toUserEmail: toUserEmail,
        toUserName: toUserName,
        message: message,
        status: 'pending',
        createdAt: new Date()
      };

      await addDoc(collection(this.db, 'buddy_invitations'), invitation);
      
      // TODO: Send email notification to recipient with registration link
      // Email should include: invitation details + link to buddy-registration page
      
    } catch (error) {
      console.error('Error sending buddy invitation:', error);
      throw error;
    }
  }

  // Get received invitations for current user
  async getReceivedInvitations(userId: string): Promise<BuddyInvitation[]> {
    try {
      const q = query(
        collection(this.db, 'buddy_invitations'),
        where('toUserId', '==', userId),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data['createdAt']?.toDate()
        } as BuddyInvitation;
      });
    } catch (error) {
      console.error('Error getting received invitations:', error);
      return [];
    }
  }

  // Get sent invitations for current user
  async getSentInvitations(userId: string): Promise<BuddyInvitation[]> {
    try {
      const q = query(
        collection(this.db, 'buddy_invitations'),
        where('fromUserId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data['createdAt']?.toDate(),
          respondedAt: data['respondedAt']?.toDate()
        } as BuddyInvitation;
      });
    } catch (error) {
      console.error('Error getting sent invitations:', error);
      return [];
    }
  }

  // Accept buddy invitation
  async acceptBuddyInvitation(invitationId: string): Promise<void> {
    try {
      // Update invitation status
      const invitationRef = doc(this.db, 'buddy_invitations', invitationId);
      await updateDoc(invitationRef, {
        status: 'accepted',
        respondedAt: new Date()
      });

      // Get invitation details
      const invitationSnap = await getDoc(invitationRef);
      if (invitationSnap.exists()) {
        const invitation = invitationSnap.data() as BuddyInvitation;
        
        // Create buddy relation
        const relation: Omit<BuddyRelation, 'id'> = {
          user1Id: invitation.fromUserId,
          user2Id: invitation.toUserId,
          status: 'accepted',
          invitationId: invitationId,
          createdAt: new Date(),
          acceptedAt: new Date()
        };
        
        await addDoc(collection(this.db, 'buddy_relations'), relation);
      }
    } catch (error) {
      console.error('Error accepting buddy invitation:', error);
      throw error;
    }
  }

  // Decline buddy invitation
  async declineBuddyInvitation(invitationId: string): Promise<void> {
    try {
      const invitationRef = doc(this.db, 'buddy_invitations', invitationId);
      await updateDoc(invitationRef, {
        status: 'declined',
        respondedAt: new Date()
      });
    } catch (error) {
      console.error('Error declining buddy invitation:', error);
      throw error;
    }
  }

  // Cancel buddy invitation (for sender)
  async cancelBuddyInvitation(invitationId: string): Promise<void> {
    try {
      const invitationRef = doc(this.db, 'buddy_invitations', invitationId);
      await updateDoc(invitationRef, {
        status: 'cancelled',
        respondedAt: new Date()
      });
    } catch (error) {
      console.error('Error cancelling buddy invitation:', error);
      throw error;
    }
  }

  // Check if there's already a buddy relation between two users
  async checkBuddyRelation(otherUserId: string): Promise<BuddyRelation | null> {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const currentUserId = currentUser.uid;
      
      // Check for relations in both directions
      const q1 = query(
        collection(this.db, 'buddy_relations'),
        where('user1Id', '==', currentUserId),
        where('user2Id', '==', otherUserId)
      );
      
      const q2 = query(
        collection(this.db, 'buddy_relations'),
        where('user1Id', '==', otherUserId),
        where('user2Id', '==', currentUserId)
      );
      
      const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      
      if (!snapshot1.empty) {
        return { id: snapshot1.docs[0].id, ...snapshot1.docs[0].data() } as BuddyRelation;
      }
      
      if (!snapshot2.empty) {
        return { id: snapshot2.docs[0].id, ...snapshot2.docs[0].data() } as BuddyRelation;
      }
      
      return null;
    } catch (error) {
      console.error('Error checking buddy relation:', error);
      return null;
    }
  }

  // Get all connected buddies (from buddy relations)
  async getConnectedBuddies(userId: string): Promise<any[]> {
    try {
      const q1 = query(
        collection(this.db, 'buddy_relations'),
        where('user1Id', '==', userId),
        where('status', '==', 'accepted')
      );
      
      const q2 = query(
        collection(this.db, 'buddy_relations'),
        where('user2Id', '==', userId),
        where('status', '==', 'accepted')
      );
      
      const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      
      const connectedUserIds: string[] = [];
      
      snapshot1.docs.forEach(doc => {
        const data = doc.data();
        connectedUserIds.push(data['user2Id']);
      });
      
      snapshot2.docs.forEach(doc => {
        const data = doc.data();
        connectedUserIds.push(data['user1Id']);
      });
      
      // Here you would typically fetch user details for these IDs
      // For now, return the IDs
      return connectedUserIds.map(id => ({ id, connected: true }));
    } catch (error) {
      console.error('Error getting connected buddies:', error);
      return [];
    }
  }
}

