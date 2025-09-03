import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BuddyRegistrationPage } from './buddy-registration.page';

const routes: Routes = [
  {
    path: '',
    component: BuddyRegistrationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BuddyRegistrationPageRoutingModule {}
