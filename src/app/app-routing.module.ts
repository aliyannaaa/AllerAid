import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { NavController } from '@ionic/angular';


const routes: Routes = [
  {
    path: 'registration',
    loadChildren: () => import('./registration/registration.module').then( m => m.RegistrationPageModule)
  },
  {
    path: '',
    redirectTo: 'tabs/home',
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
    loadChildren: () => import('./components/tabs/tabs.module').then( m => m.TabsPageModule)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./components/tabs/tabs.module').then( m => m.TabsPageModule)
  },  {
    path: 'buddy',
    loadChildren: () => import('./buddy/buddy.module').then( m => m.BuddyPageModule)
  },
  {
    path: 'allergy-onboarding',
    loadChildren: () => import('./allergy-onboarding/allergy-onboarding.module').then( m => m.AllergyOnboardingPageModule)
  },
  {
    path: 'allergy-onboarding',
    loadChildren: () => import('./start-up-page/allergy-onboarding/allergy-onboarding.module').then( m => m.AllergyOnboardingPageModule)
  },
  {
    path: 'allergy-onboarding',
    loadChildren: () => import('./start-up/allergy-onboarding/allergy-onboarding.module').then( m => m.AllergyOnboardingPageModule)
  },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
