import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserMap } from './user-map';

describe('UserMap', () => {
  let component: UserMap;
  let fixture: ComponentFixture<UserMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserMap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
