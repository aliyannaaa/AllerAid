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
  showEditModal = false;
  showActionsModal = false;
  showDeleteModal = false;
  buddyToEdit: any = null;
  selectedBuddy: any = null;

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

  openEditModal(buddy?: any) {
    if (buddy) {
      this.buddyToEdit = { ...buddy };
    } else if (this.filteredBuddies.length > 0) {
      this.buddyToEdit = { ...this.filteredBuddies[0] };
    } else {
      return;
    }
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.buddyToEdit = null;
  }

  openBuddyActions(buddy: any) {
    this.selectedBuddy = buddy;
    this.showActionsModal = true;
  }

  closeActionsModal() {
    this.showActionsModal = false;
    this.selectedBuddy = null;
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

  onEditBuddy(buddy: any) {
    this.closeActionsModal();
    this.buddyToEdit = buddy;
    this.showEditModal = true;
  }

  onSaveEditBuddy(editedBuddy: any) {
    // Save the edited buddy using buddyService (expects id and data)
    this.buddyService.updateBuddy(editedBuddy.id, editedBuddy).then(() => {
      this.loadBuddies();
      this.closeEditModal();
    });
  }

  onDeleteBuddy(buddy: any) {
    this.closeActionsModal();
    this.buddyToEdit = buddy;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.buddyToEdit = null;
  }

  async onConfirmDeleteBuddy(buddy: any) {
    try {
      await this.buddyService.deleteBuddy(buddy.id); // Delete using buddyService by ID
      this.showDeleteModal = false;
      this.buddyToEdit = null;
      await this.loadBuddies(); // Refresh the list
      // Optionally show a toast or feedback here
    } catch (error) {
      // Handle error (e.g., show a toast)
      console.error('Error deleting buddy:', error);
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
