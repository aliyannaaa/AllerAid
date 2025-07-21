import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BuddyDashboardPage } from './buddy-dashboard.page';

describe('BuddyDashboardPage', () => {
  let component: BuddyDashboardPage;
  let fixture: ComponentFixture<BuddyDashboardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BuddyDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
