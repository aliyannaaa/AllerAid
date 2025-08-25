import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      { path: 'home', 
        loadChildren: () => import('../features/dashboard/home/home.module').then(m => m.HomePageModule) 
      },
      {
        path: 'scan',
        loadChildren: () => import('../features/scan/scan.module').then(m => m.ScanPageModule)
      },
      {
        path: 'buddy',
        loadChildren: () => import('../features/buddy/buddy.module').then(m => m.BuddyPageModule)  
      },
      {
        path: 'profile',
        loadChildren: () => import('../features/profile/profile.module').then(m => m.ProfilePageModule)
      },
      {
        path: 'notification',
        loadChildren: () => import('../features/notification/notification.module').then(m => m.NotificationPageModule)
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
