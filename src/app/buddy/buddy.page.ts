import { Component, OnInit } from '@angular/core';
import { BuddyService } from '../service/buddy.service';
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
  buddyRelationship = '';
  buddyContact = '';
  buddies: any[] = [];
  filteredBuddies: any[] = [];
  searchTerm: string = '';
  showModal = false;

  constructor(
    private buddyService: BuddyService,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    this.loadBuddies();
  }

  async loadBuddies() {
    this.buddies = await this.buddyService.getBuddies();
    this.filteredBuddies = this.buddies;
  }

  async addBuddy() {
    const buddy = {
      firstName: this.buddyFirstName,
      lastName: this.buddyLastName,
      relationship: this.buddyRelationship,
      contact: this.buddyContact
    };

    try {
      await this.buddyService.addBuddy(buddy);
      this.buddyFirstName = '';
      this.buddyLastName = '';
      this.buddyRelationship = '';
      this.buddyContact = '';

      const toast = await this.toastController.create({
        message: 'Buddy added successfully!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      this.loadBuddies();
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Failed to add buddy.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async onAddBuddy(buddy: { firstName: string; lastName: string }) {
    try {
      await this.buddyService.addBuddy(buddy); // use buddyService instead of firebaseService
      const toast = await this.toastController.create({
        message: 'Buddy added successfully!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      this.loadBuddies();
      this.closeModal();
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Failed to add buddy.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  searchBuddy() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredBuddies = this.buddies;
    } else {
      this.filteredBuddies = this.buddies.filter(buddy =>
        (`${buddy.firstName} ${buddy.lastName}`.toLowerCase().includes(term))
      );
    }
  }
}
