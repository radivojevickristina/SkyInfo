import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserNotification } from './user-notification';

describe('UserNotification', () => {
  let component: UserNotification;
  let fixture: ComponentFixture<UserNotification>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserNotification]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserNotification);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
