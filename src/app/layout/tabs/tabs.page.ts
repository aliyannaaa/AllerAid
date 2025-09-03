import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { BuddyService } from '../../core/services/buddy.service';
import { RoleRedirectService } from '../../core/services/role-redirect.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements OnInit, OnDestroy {
  userRole: string = 'user';
  invitationCount: number = 0;
  emergencyCount: number = 0;
  private invitationSubscription: Subscription | null = null;
  private emergencySubscription: Subscription | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private buddyService: BuddyService,
    private roleRedirectService: RoleRedirectService,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.loadUserRole();
    await this.setupNotificationListeners();
    await this.handleInitialNavigation();
  }

  ngOnDestroy() {
    if (this.invitationSubscription) {
      this.invitationSubscription.unsubscribe();
    }
    if (this.emergencySubscription) {
      this.emergencySubscription.unsubscribe();
    }
  }

  private async loadUserRole() {
    try {
      const user = await this.authService.waitForAuthInit();
      if (user) {
        const userProfile = await this.userService.getUserProfile(user.uid);
        this.userRole = userProfile?.role || 'user';
      }
    } catch (error) {
      console.error('Error loading user role:', error);
      this.userRole = 'user'; // Default fallback
    }
  }

  private async setupNotificationListeners() {
    try {
      const user = await this.authService.waitForAuthInit();
      if (user) {
        // For buddy users, listen for emergency alerts and invitations
        if (this.userRole === 'buddy') {
          // Start listening for emergency alerts for this buddy
          this.buddyService.listenForEmergencyAlerts(user.uid);
          
          // Listen for emergency alerts count
          this.emergencySubscription = this.buddyService.activeEmergencyAlerts$.subscribe(alerts => {
            this.emergencyCount = alerts.filter(alert => alert.status === 'active').length;
          });
        }
        
        // Listen for invitation count (for any role that can receive invitations)
        this.loadInvitationCount(user.uid);
      }
    } catch (error) {
      console.error('Error setting up notification listeners:', error);
    }
  }

  private async loadInvitationCount(userId: string) {
    try {
      const invitations = await this.buddyService.getReceivedInvitations(userId);
      this.invitationCount = invitations.filter(inv => inv.status === 'pending').length;
    } catch (error) {
      console.error('Error loading invitation count:', error);
      this.invitationCount = 0;
    }
  }

  private async handleInitialNavigation() {
    // If we're on the default tabs route, redirect based on role
    if (this.router.url === '/tabs' || this.router.url === '/tabs/home') {
      const defaultRoute = this.roleRedirectService.getDefaultTabForRole(this.userRole);
      if (this.router.url !== defaultRoute) {
        this.router.navigate([defaultRoute]);
      }
    }
  }
}
