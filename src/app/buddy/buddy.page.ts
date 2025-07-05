import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../service/firebase.service'; 

@Component({
  selector: 'app-buddy',
  templateUrl: './buddy.page.html',
  styleUrls: ['./buddy.page.scss'],
  standalone: false,
})
export class BuddyPage implements OnInit {
    buddyFirstName = '';
    buddyLastName = '';

  constructor(private firebaseService: FirebaseService) { }

  ngOnInit() {
  }

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
