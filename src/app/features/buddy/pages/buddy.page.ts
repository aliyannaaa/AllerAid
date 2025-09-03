import { Component, OnInit } from '@angular/core';
import { BuddyService } from '../../../core/services/buddy.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ToastController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { BuddyInvitationsModal } from '../components/buddy-invitations-modal.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-buddy',
  templateUrl: './buddy.page.html',
  styleUrls: ['./buddy.page.scss'],
  standalone: false,
})
export class BuddyPage implements OnInit {
  showDetailsModal = false;
  buddyToShowDetails: any = null;
  
  // Loading states to prevent multiple calls
  private isLoadingBuddies = false;
  private isLoadingInvitations = false;
  private isLoadingUser = false;

  showBuddyDetails(buddy: any) {
    this.buddyToShowDetails = buddy;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.buddyToShowDetails = null;
  }
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
  invitationCount: number = 0;
  
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
    await this.loadInvitationCount();
    this.loadBuddies();
  }
  
  async loadCurrentUser() {
    if (this.isLoadingUser) return; // Prevent multiple calls
    this.isLoadingUser = true;
    
    try {
      // Wait for auth to be initialized
      const currentUser = await this.authService.waitForAuthInit();
      
      if (currentUser && !this.currentUserName) { // Only load if not already loaded
        const userProfile = await this.userService.getUserProfile(currentUser.uid);
        if (userProfile) {
          this.currentUserName = `${userProfile.firstName} ${userProfile.lastName}`;
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    } finally {
      this.isLoadingUser = false;
    }
  }

  async loadInvitationCount() {
    if (this.isLoadingInvitations) return; // Prevent multiple calls
    this.isLoadingInvitations = true;
    
    try {
      const currentUser = await this.authService.waitForAuthInit();
      if (currentUser) {
        const invitations = await this.buddyService.getReceivedInvitations(currentUser.uid);
        this.invitationCount = invitations.filter(inv => inv.status === 'pending').length;
      }
    } catch (error) {
      console.error('Error loading invitation count:', error);
      this.invitationCount = 0;
    } finally {
      this.isLoadingInvitations = false;
    }
  }

  async loadBuddies() {
    if (this.isLoadingBuddies) return; // Prevent multiple calls
    this.isLoadingBuddies = true;
    
    try {
      // Wait for auth to be initialized
      const currentUser = await this.authService.waitForAuthInit();
      
      if (currentUser) {
        // Only debug log in development
        if (!environment.production) {
          console.log('Loading buddies for current user:', currentUser.uid);
        }
        
        this.buddies = await this.buddyService.getUserBuddies(currentUser.uid);
        
        if (!environment.production) {
          console.log('Loaded buddies from buddy page:', this.buddies);
        }
      } else {
        if (!environment.production) {
          console.log('No current user found - redirecting to login');
        }
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
    } finally {
      this.isLoadingBuddies = false;
    }
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
    const modal = await this.modalController.create({
      component: BuddyInvitationsModal,
      componentProps: {}
    });

    modal.onDidDismiss().then((result) => {
      if (result.data && result.data.refreshNeeded) {
        this.loadBuddies(); // Refresh buddy list only if needed
      }
      if (result.data && result.data.invitationChanged) {
        this.loadInvitationCount(); // Only refresh invitation count if changed
      }
    });

    return await modal.present();
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

  async onAddBuddy(buddy: { firstName: string; lastName: string; email: string; relationship: string; contact: string }) {
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
    this.buddyService.updateBuddy(editedBuddy.id, editedBuddy).then(async () => {
      // Update local array instead of reloading from server
      const index = this.buddies.findIndex(b => b.id === editedBuddy.id);
      if (index !== -1) {
        this.buddies[index] = editedBuddy;
        this.filteredBuddies = [...this.buddies]; // Update filtered array
      }
      this.closeEditModal();
      
      // Show success toast
      const toast = await this.toastController.create({
        message: 'Buddy updated successfully!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    }).catch(async (error) => {
      console.error('Error updating buddy:', error);
      // Show error toast
      const toast = await this.toastController.create({
        message: 'Failed to update buddy. Please try again.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      // Fallback to reload if update fails
      this.loadBuddies();
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
      
      // Update local arrays instead of reloading from server
      this.buddies = this.buddies.filter(b => b.id !== buddy.id);
      this.filteredBuddies = this.filteredBuddies.filter(b => b.id !== buddy.id);
      
      // Show success toast
      const toast = await this.toastController.create({
        message: `${buddy.firstName} ${buddy.lastName} has been removed from your buddy list.`,
        duration: 3000,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      // Handle error (e.g., show a toast)
      console.error('Error deleting buddy:', error);
      
      // Show error toast
      const toast = await this.toastController.create({
        message: 'Failed to delete buddy. Please try again.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      
      // Fallback to reload if delete fails locally
      await this.loadBuddies();
    }
  }

  searchBuddy() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredBuddies = this.buddies;
    } else {
      this.filteredBuddies = this.buddies.filter(buddy => {
        const fullName = `${buddy.firstName} ${buddy.lastName}`.toLowerCase();
        const email = (buddy.email || '').toLowerCase();
        const relationship = (buddy.relationship || '').toLowerCase();
        const contact = (buddy.contactNumber || '').toLowerCase();
        
        return fullName.includes(term) || 
               email.includes(term) ||
               relationship.includes(term) || 
               contact.includes(term);
      });
    }
  }
}







