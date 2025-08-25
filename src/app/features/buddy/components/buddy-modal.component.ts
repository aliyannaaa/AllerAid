import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-buddy-modal',
  templateUrl: './buddy-modal.component.html',
  styleUrls: ['./buddy-modal.component.scss'],
  standalone: false,
})
export class BuddyModalComponent {
  buddyFirstName = '';
  buddyLastName = '';
  buddyRelationship = '';
  buddyContact = '';

  @Output() add = new EventEmitter<{ firstName: string; lastName: string; relationship: string; contact: string }>();
  @Output() close = new EventEmitter<void>();

  addBuddy() {
    if (this.buddyFirstName && this.buddyLastName && this.buddyRelationship && this.buddyContact) {
      this.add.emit({
        firstName: this.buddyFirstName,
        lastName: this.buddyLastName,
        relationship: this.buddyRelationship,
        contact: this.buddyContact
      });
      this.buddyFirstName = '';
      this.buddyLastName = '';
      this.buddyRelationship = '';
      this.buddyContact = '';
    }
  }

  dismiss() {
    this.close.emit();
  }
}




