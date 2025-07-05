import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit {
  selectedTab: 'overview' | 'health' | 'emergency' = 'overview';
  showEditAllergiesModal = false;
  showEditEmergencyModal = false;
  showEditMedicationsModal = false;
  showEditEmergencyMessageModal = false;

  constructor() { }

  ngOnInit() {}

  selectTab(tab: 'overview' | 'health' | 'emergency') {
    this.selectedTab = tab;
  }
}
