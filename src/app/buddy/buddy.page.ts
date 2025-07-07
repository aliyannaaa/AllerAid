import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../service/firebase.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-buddy',
  templateUrl: './buddy.page.html',
  styleUrls: ['./buddy.page.scss'],
  standalone: false,
})
export class BuddyPage implements OnInit {
  buddyFirstName = '';
  buddyLastName = '';
  buddies: any[] = [];

  constructor(
    private firebaseService: FirebaseService,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    this.loadBuddies();
  }

  async loadBuddies() {
    this.buddies = await this.firebaseService.getBuddies();
  }

  async addBuddy() {
    const buddy = {
      firstName: this.buddyFirstName,
      lastName: this.buddyLastName
    };

    try {
      await this.firebaseService.addBuddy(buddy);
      this.buddyFirstName = '';
      this.buddyLastName = '';

      const toast = await this.toastController.create({
        message: 'Buddy added successfully!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      this.loadBuddies(); // Refresh the list
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Failed to add buddy.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }
}
