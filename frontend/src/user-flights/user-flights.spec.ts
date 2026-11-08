import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserFlights } from './user-flights';

describe('UserFlights', () => {
  let component: UserFlights;
  let fixture: ComponentFixture<UserFlights>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFlights]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserFlights);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
