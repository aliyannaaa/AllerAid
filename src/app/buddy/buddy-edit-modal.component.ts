import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';

@Component({
  selector: 'app-buddy-edit-modal',
  templateUrl: './buddy-edit-modal.component.html',
  styleUrls: ['./buddy-edit-modal.component.scss'],
  standalone: false,
})
export class BuddyEditModalComponent implements OnInit {
  @Input() buddy: any;
  @Output() save = new EventEmitter<any>();
  @Output() closeEdit = new EventEmitter<void>();

  editFirstName = '';
  editLastName = '';
  editRelationship = '';
  editContact = '';

  ngOnInit() {
    if (this.buddy) {
      this.editFirstName = this.buddy.firstName;
      this.editLastName = this.buddy.lastName;
      this.editRelationship = this.buddy.relationship;
      this.editContact = this.buddy.contact;
    }
  }

  saveEdit() {
    this.save.emit({
      ...this.buddy,
      firstName: this.editFirstName,
      lastName: this.editLastName,
      relationship: this.editRelationship,
      contact: this.editContact
    });
  }

  close() {
    this.closeEdit.emit();
  }
}
