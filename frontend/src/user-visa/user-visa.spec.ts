import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserVisa } from './user-visa';

describe('UserVisa', () => {
  let component: UserVisa;
  let fixture: ComponentFixture<UserVisa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserVisa]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserVisa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
