import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { firebaseConfig } from './firebase.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth;

  constructor() {
    const app = initializeApp(firebaseConfig);
    this.auth = getAuth(app);
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // Get current user email
  getCurrentUserEmail(): string | null {
    const user = this.auth.currentUser;
    return user ? user.email : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  // Sign in with email and password
  async signIn(email: string, password: string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  // Create user with email and password
  async signUp(email: string, password: string) {
    return await createUserWithEmailAndPassword(this.auth, email, password);
  }

  // Sign out
  async signOut() {
    return await signOut(this.auth);
  }

  // Get auth instance
  getAuth(): Auth {
    return this.auth;
  }
}
