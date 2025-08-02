import { Component, OnInit } from '@angular/core';
import { BuddyService } from '../service/buddy.service';
import { AuthService } from '../service/auth.service';
import { UserService } from '../service/user.service';
import { ToastController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';

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
  
  // Current user info
  currentUserName: string = '';

  constructor(
    private buddyService: BuddyService,
    private authService: AuthService,
    private userService: UserService,
    private toastController: ToastController,
    private modalController: ModalController,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadCurrentUser();
    this.loadBuddies();
  }
  
  async loadCurrentUser() {
    // Wait for auth to be initialized
    const currentUser = await this.authService.waitForAuthInit();
    
    if (currentUser) {
      console.log('Loading current user data for:', currentUser.email); // Debug log
      
      try {
        const userProfile = await this.userService.getUserProfile(currentUser.uid);
        if (userProfile) {
          this.currentUserName = `${userProfile.firstName} ${userProfile.lastName}`;
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    }
  }

  async loadBuddies() {
    // Wait for auth to be initialized
    const currentUser = await this.authService.waitForAuthInit();
    
    if (currentUser) {
      console.log('Loading buddies for current user:', currentUser.uid); // Debug log
      
      // Debug: Show all buddies in database
      await this.buddyService.debugAllBuddies();
      
      this.buddies = await this.buddyService.getUserBuddies(currentUser.uid);
      console.log('Loaded buddies from buddy page:', this.buddies); // Debug log
    } else {
      console.log('No current user found - redirecting to login'); // Debug log
      this.buddies = [];
      
      // Show toast and redirect to login
      const toast = await this.toastController.create({
        message: 'Please log in to view your buddies',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1000);
    }
    this.filteredBuddies = this.buddies;
  }

  async addBuddy() {
    // Wait for auth to be initialized
    const currentUser = await this.authService.waitForAuthInit();
    
    if (!currentUser) {
      const toast = await this.toastController.create({
        message: 'You must be logged in to add a buddy.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    const buddy = {
      userId: currentUser.uid, // Add the current user's ID
      firstName: this.buddyFirstName,
      lastName: this.buddyLastName,
      relationship: this.buddyRelationship,
      contactNumber: this.buddyContact
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

  async openModal() {
    // For now, just show the manual buddy entry modal
    this.showModal = true;
  }

  async openInviteBuddyModal() {
    const toast = await this.toastController.create({
      message: 'Invite buddy feature coming soon!',
      duration: 2000,
      color: 'primary'
    });
    await toast.present();
  }

  async openInvitationsModal() {
    const toast = await this.toastController.create({
      message: 'Invitations feature coming soon!',
      duration: 2000,
      color: 'primary'
    });
    await toast.present();
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
      // Wait for auth to be initialized
      const currentUser = await this.authService.waitForAuthInit();
      
      if (!currentUser) {
        const toast = await this.toastController.create({
          message: 'You must be logged in to add a buddy.',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
        return;
      }

      // Add userId to the buddy object
      const buddyWithUserId = {
        ...buddy,
        userId: currentUser.uid
      };

      await this.buddyService.addBuddy(buddyWithUserId); // use buddyService instead of firebaseService
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
      await this.buddyService.deleteBuddy(buddy.id); // Delete from Firebase by ID
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
