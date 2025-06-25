import { Component } from '@angular/core';
import { FirebaseService } from '../service/firebase.service'; // make sure this path is correct

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage {
  buddyFirstName = '';
  buddyLastName = '';

  constructor(private firebaseService: FirebaseService) {}

  async addBuddy() {
    const buddy = {
      firstName: this.buddyFirstName,
      lastName: this.buddyLastName
    };

    try {
      const id = await this.firebaseService.addBuddy(buddy);
      console.log('Buddy added with ID:', id);
      this.buddyFirstName = '';
      this.buddyLastName = '';
    } catch (error) {
      console.error('Error adding buddy:', error);
    }
  }
}
