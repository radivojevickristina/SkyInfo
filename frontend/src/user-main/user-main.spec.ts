import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserMain } from './user-main';

describe('UserMain', () => {
  let component: UserMain;
  let fixture: ComponentFixture<UserMain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMain]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserMain);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
