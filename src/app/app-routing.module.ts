import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';


const routes: Routes = [
  {
    path: 'registration',
    loadChildren: () => import('./registration/registration.module').then( m => m.RegistrationPageModule)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'scan',
    loadChildren: () => import('./scan/scan.module').then( m => m.ScanPageModule)
  },
  {

    path: 'profile',
    loadChildren: () => import('./profile/profile.module').then( m => m.ProfilePageModule)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./components/tabs/tabs.module').then( m => m.TabsPageModule),
    canActivate: [AuthGuard]
  },
  {

    path: 'buddy',
    loadChildren: () => import('./buddy/buddy.module').then( m => m.BuddyPageModule),
    canActivate: [AuthGuard]
  },
  {

    path: 'allergy-onboarding',
    loadChildren: () => import('./start-up/allergy-onboarding/allergy-onboarding.module').then( m => m.AllergyOnboardingPageModule)
  },
  {

    path: 'profile',
    loadChildren: () => import('./profile/profile.module').then( m => m.ProfilePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'notification',
    loadChildren: () => import('./notification/notification.module').then( m => m.NotificationPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'buddy-dashboard',
    loadChildren: () => import('./pages/buddy/buddy-dashboard/buddy-dashboard.module').then( m => m.BuddyDashboardPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'responder-dashboard',
    loadChildren: () => import('./pages/responder/responder-dashboard/responder-dashboard.module').then( m => m.ResponderDashboardPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'responder-map',
    loadChildren: () => import('./responder-map/responder-map.module').then( m => m.ResponderMapPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'doctor-dashboard',
    loadChildren: () => import('./pages/doctor-dashboard/doctor-dashboard.module').then( m => m.DoctorDashboardPageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['doctor', 'nurse'] }
  },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
