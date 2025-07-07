import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-allergy-onboarding',
  templateUrl: './allergy-onboarding.page.html',
  styleUrls: ['./allergy-onboarding.page.scss'],
  standalone: false,
})
export class AllergyOnboardingPage implements OnInit {
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

  ngOnInit() {
  }

  submitAllergies() {
    // TODO: Save allergies to backend or local storage
    // Example: console.log(this.allergyOptions.filter(a => a.checked));
    // After saving, navigate to main app
    // this.router.navigate(['/tabs/home']);
  }

}
