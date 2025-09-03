import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController, AlertController } from '@ionic/angular';
import { BuddyService, BuddyInvitation } from '../../../core/services/buddy.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-buddy-invitations-modal',
  templateUrl: './buddy-invitations-modal.component.html',
  styleUrls: ['./buddy-invitations-modal.component.scss'],
  standalone: false,
})
export class BuddyInvitationsModal implements OnInit {

  selectedSegment: 'invite' | 'received' | 'sent' = 'invite';
  
  // Send invitation form
  inviteEmail: string = '';
  inviteMessage: string = 'Hi! I\'d like you to be my emergency buddy. This will help us stay connected during allergy emergencies.';
  
  // Invitations lists
  receivedInvitations: BuddyInvitation[] = [];
  sentInvitations: BuddyInvitation[] = [];
  
  isLoading: boolean = false;

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController,
    private buddyService: BuddyService,
    private userService: UserService
  ) { }

  async ngOnInit() {
    await this.loadInvitations();
  }

  async loadInvitations() {
    try {
      const currentUser = await this.userService.getCurrentUserProfile();
      if (currentUser) {
        this.receivedInvitations = await this.buddyService.getReceivedInvitations(currentUser.uid);
        this.sentInvitations = await this.buddyService.getSentInvitations(currentUser.uid);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
      this.showToast('Error loading invitations', 'danger');
    }
  }

  onSegmentChange() {
    // Refresh data when switching tabs
    this.loadInvitations();
  }

  async sendInvitation() {
    if (!this.inviteEmail) {
      this.showToast('Please enter an email address', 'warning');
      return;
    }

    try {
      this.isLoading = true;

      // First, search for the user by email
      const targetUser = await this.userService.getUserByEmail(this.inviteEmail);
      
      if (!targetUser) {
        this.showToast('User with this email not found. They need to register first.', 'warning');
        this.isLoading = false;
        return;
      }

      // Check if already buddies or invitation already sent
      const existingInvitation = this.sentInvitations.find(inv => 
        inv.toUserEmail === this.inviteEmail && inv.status === 'pending'
      );
      
      if (existingInvitation) {
        this.showToast('You already have a pending invitation to this user', 'warning');
        this.isLoading = false;
        return;
      }

      // Send the invitation
      await this.buddyService.sendBuddyInvitation(
        targetUser.email,
        targetUser.fullName || `${targetUser.firstName} ${targetUser.lastName}`,
        this.inviteMessage
      );

      this.showToast('Invitation sent successfully!', 'success');
      
      // Clear form
      this.inviteEmail = '';
      this.inviteMessage = 'Hi! I\'d like you to be my emergency buddy. This will help us stay connected during allergy emergencies.';
      
      // Refresh sent invitations
      await this.loadInvitations();
      
      // Switch to sent tab to show the sent invitation
      this.selectedSegment = 'sent';

    } catch (error) {
      console.error('Error sending invitation:', error);
      this.showToast('Error sending invitation. Please try again.', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async acceptInvitation(invitationId: string) {
    const alert = await this.alertController.create({
      header: 'Accept Buddy Invitation',
      message: 'Are you sure you want to accept this buddy invitation?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Accept',
          handler: async () => {
            try {
              await this.buddyService.acceptBuddyInvitation(invitationId);
              this.showToast('Buddy invitation accepted!', 'success');
              await this.loadInvitations();
              this.dismiss(true); // Close modal and refresh parent
            } catch (error) {
              console.error('Error accepting invitation:', error);
              this.showToast('Error accepting invitation', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async declineInvitation(invitationId: string) {
    const alert = await this.alertController.create({
      header: 'Decline Buddy Invitation',
      message: 'Are you sure you want to decline this buddy invitation?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Decline',
          handler: async () => {
            try {
              await this.buddyService.declineBuddyInvitation(invitationId);
              this.showToast('Invitation declined', 'medium');
              await this.loadInvitations();
            } catch (error) {
              console.error('Error declining invitation:', error);
              this.showToast('Error declining invitation', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async cancelInvitation(invitationId: string) {
    const alert = await this.alertController.create({
      header: 'Cancel Invitation',
      message: 'Are you sure you want to cancel this invitation?',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Cancel Invitation',
          handler: async () => {
            try {
              await this.buddyService.cancelBuddyInvitation(invitationId);
              this.showToast('Invitation cancelled', 'medium');
              await this.loadInvitations();
            } catch (error) {
              console.error('Error cancelling invitation:', error);
              this.showToast('Error cancelling invitation', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  getInvitationStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'declined': return 'danger';
      case 'cancelled': return 'medium';
      default: return 'medium';
    }
  }

  getPendingReceivedCount(): number {
    return this.receivedInvitations.filter(inv => inv.status === 'pending').length;
  }

  getPendingSentCount(): number {
    return this.sentInvitations.filter(inv => inv.status === 'pending').length;
  }

  async showToast(message: string, color: string = 'medium') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }

  dismiss(refreshNeeded: boolean = false) {
    this.modalController.dismiss({
      refreshNeeded: refreshNeeded
    });
  }
}
