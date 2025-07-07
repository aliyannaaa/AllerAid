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

  allergyOptions = [
    { name: 'peanuts', label: 'Peanuts/Nuts', checked: false },
    { name: 'dairy', label: 'Dairy/Milk', checked: false },
    { name: 'eggs', label: 'Eggs', checked: false },
    { name: 'wheat', label: 'Wheat/Gluten', checked: false },
    { name: 'fish', label: 'Fish', checked: false },
    { name: 'shellfish', label: 'Shellfish', checked: false },
    { name: 'soy', label: 'Soy', checked: false },
    { name: 'pollen', label: 'Pollen', checked: false },
    { name: 'latex', label: 'Latex', checked: false },
    { name: 'animalDander', label: 'Animal Dander', checked: false },
    { name: 'insectStings', label: 'Insect Stings', checked: false },
    { name: 'medication', label: 'Medication', checked: false, hasInput: true, value: '' },
    { name: 'others', label: 'Others', checked: false, hasInput: true, value: '' },
  ];

  constructor() { }

  ngOnInit() {}

  selectTab(tab: 'overview' | 'health' | 'emergency') {
    this.selectedTab = tab;
  }

  saveAllergies() {
    // You can handle saving logic here
    this.showEditAllergiesModal = false;
  }
}
